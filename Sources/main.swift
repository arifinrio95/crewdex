// Crewdex — native macOS shell.
// Hosts the web UI in a WKWebView, runs `codex app-server` as a child process,
// and gives the page a small, explicit bridge to the file system and macOS.

import Cocoa
import WebKit
import Quartz
import QuickLookThumbnailing
import UniformTypeIdentifiers
import UserNotifications

let fm = FileManager.default
let home = NSHomeDirectory()

// MARK: - Settings shared with the page

struct Paths {
    static var root: String {
        if let r = ProcessInfo.processInfo.environment["BEARING_ROOT"], !r.isEmpty { return r }
        if let r = UserDefaults.standard.string(forKey: "bearingRoot"), !r.isEmpty { return r }
        return home + "/Crewdex"
    }
    static var appSupport: String { root + "/.crewdex" }
    static var logs: String { appSupport + "/logs" }
}

func mkdirp(_ p: String) { try? fm.createDirectory(atPath: p, withIntermediateDirectories: true) }

/// Paths the page may read or write. Everything under the home folder and temp folders.
func allowed(_ path: String) -> Bool {
    let p = (path as NSString).standardizingPath
    return p.hasPrefix(home + "/") || p.hasPrefix("/private/var/folders/") || p.hasPrefix("/tmp/") || p.hasPrefix("/private/tmp/") || p.hasPrefix("/var/folders/")
}

func mimeType(_ path: String) -> String {
    let ext = (path as NSString).pathExtension.lowercased()
    switch ext {
    case "js", "mjs": return "text/javascript"
    case "css": return "text/css"
    case "html", "htm": return "text/html"
    case "json", "jsonl": return "application/json"
    case "md", "txt", "log", "csv", "tsv", "yaml", "yml", "toml": return "text/plain; charset=utf-8"
    case "svg": return "image/svg+xml"
    default:
        return UTType(filenameExtension: ext)?.preferredMIMEType ?? "application/octet-stream"
    }
}

// MARK: - Login-shell environment (GUI apps start with a bare PATH)

let loginEnv: [String: String] = {
    var env = ProcessInfo.processInfo.environment
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/bin/zsh")
    p.arguments = ["-lic", "env -0"]
    let out = Pipe(); p.standardOutput = out; p.standardError = Pipe()
    do {
        try p.run()
        let data = out.fileHandleForReading.readDataToEndOfFile()
        p.waitUntilExit()
        for entry in data.split(separator: 0) {
            guard let s = String(data: Data(entry), encoding: .utf8), let eq = s.firstIndex(of: "=") else { continue }
            env[String(s[..<eq])] = String(s[s.index(after: eq)...])
        }
    } catch {}
    let extra = ["/opt/homebrew/bin", "/usr/local/bin", home + "/.local/bin"]
    let path = env["PATH"] ?? "/usr/bin:/bin:/usr/sbin:/sbin"
    env["PATH"] = (extra.filter { !path.contains($0) } + [path]).joined(separator: ":")
    return env
}()

func findCodex() -> String? {
    if let s = UserDefaults.standard.string(forKey: "codexPath"), fm.isExecutableFile(atPath: s) { return s }
    let candidates = [
        "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex",
        "/Applications/Codex.app/Contents/Resources/codex",
        "/opt/homebrew/bin/codex", "/usr/local/bin/codex", home + "/.local/bin/codex", home + "/.npm-global/bin/codex",
    ]
    for c in candidates where fm.isExecutableFile(atPath: c) { return c }
    for dir in (loginEnv["PATH"] ?? "").split(separator: ":") {
        let c = String(dir) + "/codex"
        if fm.isExecutableFile(atPath: c) { return c }
    }
    return nil
}

// MARK: - Codex app-server process

final class CodexProcess {
    var proc: Process?
    var stdin: FileHandle?
    var buffer = Data()
    var onLine: ((String) -> Void)?
    var onExit: ((Int32, String) -> Void)?
    var stderrTail = ""
    let logQueue = DispatchQueue(label: "bearing.codex.log")

    var running: Bool { proc?.isRunning ?? false }

    func start() throws -> String {
        if running { return proc?.executableURL?.path ?? "" }
        guard let bin = findCodex() else { throw NSError(domain: "Crewdex", code: 1, userInfo: [NSLocalizedDescriptionKey: "Codex CLI was not found. Install the ChatGPT app or `npm i -g @openai/codex`, or set its path in Settings."]) }
        let p = Process()
        p.executableURL = URL(fileURLWithPath: bin)
        p.arguments = ["app-server"]
        p.environment = loginEnv
        p.currentDirectoryURL = URL(fileURLWithPath: home)
        let inPipe = Pipe(), outPipe = Pipe(), errPipe = Pipe()
        p.standardInput = inPipe; p.standardOutput = outPipe; p.standardError = errPipe
        outPipe.fileHandleForReading.readabilityHandler = { [weak self] h in
            let d = h.availableData
            guard let self = self, !d.isEmpty else { return }
            self.buffer.append(d)
            while let nl = self.buffer.firstIndex(of: 0x0A) {
                let lineData = self.buffer.subdata(in: self.buffer.startIndex..<nl)
                self.buffer.removeSubrange(self.buffer.startIndex...nl)
                if let line = String(data: lineData, encoding: .utf8), !line.isEmpty { self.onLine?(line) }
            }
        }
        mkdirp(Paths.logs)
        let logPath = Paths.logs + "/codex-stderr.log"
        errPipe.fileHandleForReading.readabilityHandler = { [weak self] h in
            let d = h.availableData
            guard let self = self, !d.isEmpty else { return }
            let s = String(data: d, encoding: .utf8) ?? ""
            self.stderrTail = String((self.stderrTail + s).suffix(4000))
            self.logQueue.async {
                if !fm.fileExists(atPath: logPath) { fm.createFile(atPath: logPath, contents: nil) }
                if let fh = FileHandle(forWritingAtPath: logPath) { fh.seekToEndOfFile(); fh.write(d); try? fh.close() }
            }
        }
        p.terminationHandler = { [weak self] pr in
            guard let self = self else { return }
            outPipe.fileHandleForReading.readabilityHandler = nil
            errPipe.fileHandleForReading.readabilityHandler = nil
            DispatchQueue.main.async { self.onExit?(pr.terminationStatus, self.stderrTail) }
        }
        try p.run()
        proc = p; stdin = inPipe.fileHandleForWriting; buffer = Data()
        return bin
    }

    func send(_ line: String) {
        guard let h = stdin, running else { return }
        var d = Data(line.utf8); d.append(0x0A)
        h.write(d)
    }

    func stop() { proc?.terminate(); proc = nil; stdin = nil }
}

// MARK: - Custom scheme: bearing://app/... (bundled UI) and bearing://file/<abs path>

final class SchemeHandler: NSObject, WKURLSchemeHandler {
    let webRoot: String
    init(webRoot: String) { self.webRoot = webRoot }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path: String
        if url.host == "file" {
            path = url.path.removingPercentEncoding ?? url.path
            guard allowed(path) else { return fail(task, 403) }
        } else {
            let rel = url.path == "/" || url.path.isEmpty ? "/index.html" : url.path
            path = webRoot + (rel.removingPercentEncoding ?? rel)
        }
        var isDir: ObjCBool = false
        guard fm.fileExists(atPath: path, isDirectory: &isDir), !isDir.boolValue, let data = fm.contents(atPath: path) else { return fail(task, 404) }
        let headers = ["Content-Type": mimeType(path), "Content-Length": "\(data.count)", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*"]
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(resp); task.didReceive(data); task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
    func fail(_ task: WKURLSchemeTask, _ code: Int) {
        let resp = HTTPURLResponse(url: task.request.url!, statusCode: code, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "text/plain"])!
        task.didReceive(resp); task.didReceive(Data("\(code)".utf8)); task.didFinish()
    }
}

// MARK: - Window controller (also the Quick Look panel controller)

final class MainController: NSWindowController, WKScriptMessageHandlerWithReply, WKNavigationDelegate, WKUIDelegate, QLPreviewPanelDataSource, QLPreviewPanelDelegate, NSWindowDelegate {
    var web: WKWebView!
    let codex = CodexProcess()
    var previewURLs: [URL] = []

    convenience init() {
        let win = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1360, height: 900), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        win.titlebarAppearsTransparent = true
        win.titleVisibility = .hidden
        win.title = "Crewdex"
        win.minSize = NSSize(width: 760, height: 560)
        win.setFrameAutosaveName("CrewdexMain")
        win.backgroundColor = NSColor(red: 0.969, green: 0.969, blue: 0.961, alpha: 1)
        win.isRestorable = true
        self.init(window: win)
        win.delegate = self
        if !win.setFrameUsingName("CrewdexMain") { win.center() }

        let cfg = WKWebViewConfiguration()
        let webRoot = Bundle.main.resourcePath! + "/web"
        cfg.setURLSchemeHandler(SchemeHandler(webRoot: webRoot), forURLScheme: "bearing")
        cfg.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "native")
        cfg.preferences.setValue(true, forKey: "developerExtrasEnabled")
        cfg.preferences.javaScriptCanOpenWindowsAutomatically = false
        web = WKWebView(frame: win.contentView!.bounds, configuration: cfg)
        web.autoresizingMask = [.width, .height]
        web.navigationDelegate = self
        web.uiDelegate = self
        web.setValue(false, forKey: "drawsBackground")
        if #available(macOS 13.3, *) { web.isInspectable = true }
        win.contentView!.addSubview(web)
        web.load(URLRequest(url: URL(string: "bearing://app/index.html")!))

        codex.onLine = { [weak self] line in
            DispatchQueue.main.async { self?.web.callAsyncJavaScript("window.__codexIn && window.__codexIn(line)", arguments: ["line": line], in: nil, in: .page, completionHandler: nil) }
        }
        codex.onExit = { [weak self] code, tail in
            self?.web.callAsyncJavaScript("window.__codexExit && window.__codexExit(code, tail)", arguments: ["code": Int(code), "tail": tail], in: nil, in: .page, completionHandler: nil)
        }
    }

    // Links: open http(s) externally, keep bearing:// inside.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = action.request.url, ["http", "https", "mailto"].contains(url.scheme ?? ""), action.targetFrame?.isMainFrame ?? true {
            if action.navigationType == .linkActivated || action.targetFrame == nil { NSWorkspace.shared.open(url); return decisionHandler(.cancel) }
        }
        decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { NSWorkspace.shared.open(url) }
        return nil
    }
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel(); panel.allowsMultipleSelection = parameters.allowsMultipleSelection; panel.canChooseDirectories = parameters.allowsDirectories
        panel.beginSheetModal(for: window!) { r in completionHandler(r == .OK ? panel.urls : nil) }
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }

    // MARK: self-test (BEARING_SELFTEST=<output dir>): renders screens to PNG and writes a JSON report, then quits.
    var selftestStarted = false
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let out = ProcessInfo.processInfo.environment["BEARING_SELFTEST"], !selftestStarted else { return }
        selftestStarted = true
        mkdirp(out)
        let routes = (ProcessInfo.processInfo.environment["BEARING_SELFTEST_ROUTES"] ?? "now,week,horizon,settings").split(separator: ",").map(String.init)
        DispatchQueue.main.asyncAfter(deadline: .now() + 6) {
            self.web.callAsyncJavaScript("return await window.__selftest()", arguments: [:], in: nil, in: .page) { result in
                var report = "{}"
                if case .success(let v) = result, let s = v as? String { report = s }
                if case .failure(let e) = result { report = "{\"error\": \"\(e.localizedDescription)\"}" }
                try? report.write(toFile: out + "/report.json", atomically: true, encoding: .utf8)
                self.snapshots(routes, out: out) { NSApp.terminate(nil) }
            }
        }
    }
    func snapshots(_ routes: [String], out: String, done: @escaping () -> Void) {
        guard let r = routes.first else { return done() }
        web.evaluateJavaScript("window.__route && window.__route('\(r)')") { _, _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                let cfg = WKSnapshotConfiguration()
                self.web.takeSnapshot(with: cfg) { img, _ in
                    if let img = img, let tiff = img.tiffRepresentation, let bmp = NSBitmapImageRep(data: tiff), let png = bmp.representation(using: .png, properties: [:]) {
                        try? png.write(to: URL(fileURLWithPath: out + "/\(r.replacingOccurrences(of: "/", with: "_")).png"))
                    }
                    self.snapshots(Array(routes.dropFirst()), out: out, done: done)
                }
            }
        }
    }

    // MARK: bridge
    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let op = body["op"] as? String else { return replyHandler(nil, "bad message") }
        let str = { (k: String) -> String in (body[k] as? String) ?? "" }
        let path = (str("path") as NSString).expandingTildeInPath
        func guardPath(_ p: String) -> Bool { if !allowed(p) { replyHandler(nil, "Path outside the home folder: \(p)"); return false }; return true }
        switch op {
        case "info":
            replyHandler(["home": home, "root": Paths.root, "codexPath": findCodex() ?? "", "version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] ?? "0"], nil)
        case "setRoot":
            UserDefaults.standard.set(path, forKey: "bearingRoot"); mkdirp(path); replyHandler(Paths.root, nil)
        case "setCodexPath":
            UserDefaults.standard.set(path, forKey: "codexPath"); replyHandler(findCodex() ?? "", nil)
        case "listProjects":
            let root = Paths.root; mkdirp(root)
            var out: [[String: Any]] = []
            for name in (try? fm.contentsOfDirectory(atPath: root)) ?? [] where !name.hasPrefix(".") {
                let dir = root + "/" + name
                if let t = try? String(contentsOfFile: dir + "/.crewdex/project.json", encoding: .utf8) { out.append(["dir": dir, "text": t]) }
            }
            replyHandler(out, nil)
        case "readText":
            guard guardPath(path) else { return }
            replyHandler(try? String(contentsOfFile: path, encoding: .utf8), nil)
        case "writeText", "appendText":
            guard guardPath(path) else { return }
            mkdirp((path as NSString).deletingLastPathComponent)
            let text = str("text")
            if op == "writeText" {
                do { try text.write(toFile: path, atomically: true, encoding: .utf8); replyHandler(true, nil) } catch { replyHandler(nil, error.localizedDescription) }
            } else {
                if !fm.fileExists(atPath: path) { fm.createFile(atPath: path, contents: nil) }
                if let fh = FileHandle(forWritingAtPath: path) { fh.seekToEndOfFile(); fh.write(Data(text.utf8)); try? fh.close(); replyHandler(true, nil) } else { replyHandler(nil, "Cannot open \(path)") }
            }
        case "list":
            guard guardPath(path) else { return }
            let recursive = (body["recursive"] as? Bool) ?? false
            var out: [[String: Any]] = []
            let names: [String] = recursive ? ((fm.enumerator(atPath: path)?.allObjects as? [String]) ?? []).filter { !$0.split(separator: "/").contains { $0.hasPrefix(".") } }.prefix(2000).map { $0 } : ((try? fm.contentsOfDirectory(atPath: path)) ?? [])
            for n in names {
                let full = path + "/" + n
                guard let a = try? fm.attributesOfItem(atPath: full) else { continue }
                out.append(["name": n, "path": full, "dir": (a[.type] as? FileAttributeType) == .typeDirectory, "size": (a[.size] as? Int) ?? 0, "mtime": ((a[.modificationDate] as? Date)?.timeIntervalSince1970 ?? 0) * 1000])
            }
            replyHandler(out, nil)
        case "exists":
            var isDir: ObjCBool = false
            let e = fm.fileExists(atPath: path, isDirectory: &isDir)
            replyHandler(e ? (isDir.boolValue ? "dir" : "file") : nil, nil)
        case "mkdir":
            guard guardPath(path) else { return }
            mkdirp(path); replyHandler(true, nil)
        case "copy":
            let to = (str("to") as NSString).expandingTildeInPath
            guard guardPath(path), guardPath(to) else { return }
            mkdirp((to as NSString).deletingLastPathComponent)
            try? fm.removeItem(atPath: to)
            do { try fm.copyItem(atPath: path, toPath: to); replyHandler(true, nil) } catch { replyHandler(nil, error.localizedDescription) }
        case "trash":
            guard guardPath(path), path.hasPrefix(Paths.root + "/") || path.contains("/.agents/skills/") else { return replyHandler(nil, "Only items inside the Crewdex folder or a skills folder can be moved to the Trash.") }
            NSWorkspace.shared.recycle([URL(fileURLWithPath: path)]) { _, err in replyHandler(err == nil, err?.localizedDescription) }
        case "open":
            NSWorkspace.shared.open(URL(fileURLWithPath: path)); replyHandler(true, nil)
        case "openURL":
            if let u = URL(string: str("url")), ["http", "https", "mailto"].contains(u.scheme ?? "") { NSWorkspace.shared.open(u) }
            replyHandler(true, nil)
        case "reveal":
            NSWorkspace.shared.activateFileViewerSelecting([URL(fileURLWithPath: path)]); replyHandler(true, nil)
        case "quicklook":
            let paths = (body["paths"] as? [String]) ?? [path]
            previewURLs = paths.map { URL(fileURLWithPath: ($0 as NSString).expandingTildeInPath) }
            if let panel = QLPreviewPanel.shared() {
                panel.dataSource = self; panel.delegate = self
                panel.currentPreviewItemIndex = (body["index"] as? Int) ?? 0
                panel.reloadData(); panel.makeKeyAndOrderFront(nil)
            }
            replyHandler(true, nil)
        case "thumbnail":
            let size = CGFloat((body["size"] as? Double) ?? 480)
            let req = QLThumbnailGenerator.Request(fileAt: URL(fileURLWithPath: path), size: CGSize(width: size, height: size), scale: 2, representationTypes: .thumbnail)
            QLThumbnailGenerator.shared.generateBestRepresentation(for: req) { rep, _ in
                DispatchQueue.main.async {
                    guard let img = rep?.nsImage, let tiff = img.tiffRepresentation, let bmp = NSBitmapImageRep(data: tiff), let png = bmp.representation(using: .png, properties: [:]) else { return replyHandler(nil, nil) }
                    replyHandler("data:image/png;base64," + png.base64EncodedString(), nil)
                }
            }
        case "pickFolder":
            let panel = NSOpenPanel(); panel.canChooseDirectories = true; panel.canChooseFiles = (body["files"] as? Bool) ?? false; panel.canCreateDirectories = true
            panel.message = str("message")
            panel.beginSheetModal(for: window!) { r in replyHandler(r == .OK ? panel.url?.path : nil, nil) }
        case "pickFiles":
            let panel = NSOpenPanel(); panel.canChooseDirectories = true; panel.canChooseFiles = true; panel.allowsMultipleSelection = true
            panel.message = str("message")
            panel.beginSheetModal(for: window!) { r in replyHandler(r == .OK ? panel.urls.map { $0.path } : [], nil) }
        case "badge":
            NSApp.dockTile.badgeLabel = str("text").isEmpty ? nil : str("text"); replyHandler(true, nil)
        case "attention":
            NSApp.requestUserAttention(.informationalRequest); replyHandler(true, nil)
        case "notify":
            let c = UNMutableNotificationContent(); c.title = str("title"); c.body = str("body"); c.sound = .default
            UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: UUID().uuidString, content: c, trigger: nil))
            replyHandler(true, nil)
        case "windowColor":
            if let hex = body["hex"] as? String, let c = NSColor(hex: hex) { window?.backgroundColor = c }
            window?.appearance = (body["dark"] as? Bool) == true ? NSAppearance(named: .darkAqua) : NSAppearance(named: .aqua)
            replyHandler(true, nil)
        case "codex.start":
            do { replyHandler(try codex.start(), nil) } catch { replyHandler(nil, error.localizedDescription) }
        case "codex.send":
            codex.send(str("line")); replyHandler(true, nil)
        case "codex.stop":
            codex.stop(); replyHandler(true, nil)
        default:
            replyHandler(nil, "Unknown op \(op)")
        }
    }

    // MARK: Quick Look
    override func acceptsPreviewPanelControl(_ panel: QLPreviewPanel!) -> Bool { true }
    override func beginPreviewPanelControl(_ panel: QLPreviewPanel!) { panel.dataSource = self; panel.delegate = self }
    override func endPreviewPanelControl(_ panel: QLPreviewPanel!) {}
    func numberOfPreviewItems(in panel: QLPreviewPanel!) -> Int { previewURLs.count }
    func previewPanel(_ panel: QLPreviewPanel!, previewItemAt index: Int) -> QLPreviewItem! { previewURLs[index] as NSURL }

    func windowWillClose(_ notification: Notification) { codex.stop(); NSApp.terminate(nil) }
}

extension NSColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces); if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate {
    var main: MainController!
    func applicationDidFinishLaunching(_ n: Notification) {
        buildMenu()
        mkdirp(Paths.root)
        main = MainController()
        main.showWindow(nil)
        NSApp.activate(ignoringOtherApps: true)
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ n: Notification) { main?.codex.stop() }

    @objc func reload() { main.web.reload() }
    @objc func settings() { main.web.evaluateJavaScript("window.openSettings && window.openSettings()") }
    @objc func revealRoot() { NSWorkspace.shared.activateFileViewerSelecting([URL(fileURLWithPath: Paths.root)]) }

    func buildMenu() {
        let bar = NSMenu()
        func sub(_ title: String, _ items: [NSMenuItem]) { let m = NSMenu(title: title); items.forEach(m.addItem); let it = NSMenuItem(); it.submenu = m; bar.addItem(it) }
        func item(_ t: String, _ a: Selector?, _ k: String, _ mods: NSEvent.ModifierFlags = .command, target: AnyObject? = nil) -> NSMenuItem { let i = NSMenuItem(title: t, action: a, keyEquivalent: k); i.keyEquivalentModifierMask = mods; if let target = target { i.target = target }; return i }
        sub("Crewdex", [item("About Crewdex", #selector(NSApplication.orderFrontStandardAboutPanel(_:)), ""), .separator(), item("Settings…", #selector(settings), ",", target: self), item("Show Crewdex Folder", #selector(revealRoot), "", target: self), .separator(), item("Hide Crewdex", #selector(NSApplication.hide(_:)), "h"), item("Quit Crewdex", #selector(NSApplication.terminate(_:)), "q")])
        sub("Edit", [item("Undo", Selector(("undo:")), "z"), item("Redo", Selector(("redo:")), "Z", [.command, .shift]), .separator(), item("Cut", #selector(NSText.cut(_:)), "x"), item("Copy", #selector(NSText.copy(_:)), "c"), item("Paste", #selector(NSText.paste(_:)), "v"), item("Select All", #selector(NSText.selectAll(_:)), "a")])
        sub("View", [item("Reload", #selector(reload), "r", target: self), item("Enter Full Screen", #selector(NSWindow.toggleFullScreen(_:)), "f", [.command, .control])])
        sub("Window", [item("Minimize", #selector(NSWindow.performMiniaturize(_:)), "m"), item("Zoom", #selector(NSWindow.performZoom(_:)), "")])
        NSApp.mainMenu = bar
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
