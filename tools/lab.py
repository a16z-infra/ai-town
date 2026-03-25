#!/usr/bin/env python3
"""Stanford Town — 统一实验台 CLI 控制器"""

import json
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent
ROOT_DIR = LAB_DIR.parent
PROJECTS_FILE = LAB_DIR / "projects.json"
PROJECTS_LOCAL_FILE = LAB_DIR / "projects.local.json"
STATUS_FILE = LAB_DIR / "status.json"
LOG_DIR = LAB_DIR / "logs"
RUN_DIR = LAB_DIR / "run"
NVM_DIR = Path.home() / ".nvm"
CONDA_BIN = Path.home() / "opt" / "anaconda3" / "bin" / "conda"

DASHBOARD_PORT = 4000


def load_projects():
    """Load projects.json, merge with projects.local.json overrides."""
    with open(PROJECTS_FILE) as f:
        projects = json.load(f)

    overrides = {}
    if PROJECTS_LOCAL_FILE.exists():
        with open(PROJECTS_LOCAL_FILE) as f:
            for item in json.load(f):
                overrides[item["name"]] = item

    for proj in projects:
        if proj["name"] in overrides:
            proj.update(overrides[proj["name"]])

    return projects


def get_project(name):
    """Get a single project config by name."""
    for proj in load_projects():
        if proj["name"] == name:
            return proj
    return None


def get_nvm_node_bin(version):
    """Get the path to a specific Node.js version's bin directory via nvm."""
    versions_dir = NVM_DIR / "versions" / "node"
    if not versions_dir.exists():
        return None
    # Find matching version directory
    for d in sorted(versions_dir.iterdir(), reverse=True):
        if d.name.startswith(f"v{version}.") or d.name == f"v{version}":
            bin_dir = d / "bin"
            if bin_dir.exists():
                return str(bin_dir)
    return None


def get_pid_file(name):
    return RUN_DIR / f"{name}.pid"


def read_pid(name):
    """Read PID from pid file, return (pid, pgid) or (None, None)."""
    pid_file = get_pid_file(name)
    if not pid_file.exists():
        return None, None
    try:
        data = json.loads(pid_file.read_text())
        return data.get("pid"), data.get("pgid")
    except (json.JSONDecodeError, KeyError):
        # Legacy format: just a number
        try:
            pid = int(pid_file.read_text().strip())
            return pid, pid
        except ValueError:
            return None, None


def is_pid_alive(pid):
    """Check if a process with given PID is alive."""
    if pid is None:
        return False
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def is_port_listening(port):
    """Check if a port is currently being listened on."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(("127.0.0.1", port))
            return result == 0
    except socket.error:
        return False


def http_healthcheck(port, path="/"):
    """Perform HTTP healthcheck."""
    try:
        url = f"http://127.0.0.1:{port}{path}"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status < 500
    except (urllib.error.URLError, OSError, TimeoutError):
        return False


def check_setup(proj):
    """Check if a project is installed (directory exists with expected files)."""
    proj_dir = ROOT_DIR / proj["path"]
    if not proj_dir.exists():
        return "missing"
    # Check for node_modules or venv indicators
    if proj["runtime"] == "node":
        if (proj_dir / "node_modules").exists():
            return "installed"
        return "cloned"
    elif proj["runtime"] == "conda":
        return "installed"  # We'll check conda env separately
    return "cloned"


def check_credentials(proj):
    """Check if required credentials are present."""
    if not proj.get("needs_api_key", False):
        return "ok"
    env_file = LAB_DIR / "env" / f"{proj['name']}.env"
    if not env_file.exists():
        return "missing"
    content = env_file.read_text()
    # Check for placeholder values
    if "YOUR_" in content or "CHANGE_ME" in content or content.strip() == "":
        return "missing"
    return "ok"


def get_blockers(proj):
    """Get list of blockers for a project."""
    blockers = []
    if proj.get("needs_api_key", False):
        if check_credentials(proj) != "ok":
            key_type = "openai_api_key" if proj["name"] == "agentsims" else "api_key"
            if proj["name"] == "worldcraft":
                key_type = "gemini_api_key"
            blockers.append(f"needs_{key_type}")
    if proj.get("needs_gui", False):
        blockers.append("needs_godot_gui")
    return blockers


def get_runtime_status(proj):
    """Check runtime status of a project."""
    pid, pgid = read_pid(proj["name"])
    port = proj.get("port", proj["default_port"])

    if is_pid_alive(pid):
        if is_port_listening(port):
            hc = proj.get("healthcheck", {})
            if hc.get("type") == "http":
                if http_healthcheck(port, hc.get("path", "/")):
                    return "healthy", pid, port
                return "unhealthy", pid, port
            elif hc.get("type") == "tcp":
                return "healthy", pid, port
        return "starting", pid, port
    else:
        # Clean up stale pid file
        pid_file = get_pid_file(proj["name"])
        if pid_file.exists():
            pid_file.unlink()
        if is_port_listening(port):
            return "port_in_use", None, port
        return "stopped", None, port


def check_infra():
    """Check infrastructure services."""
    infra = {}

    # Ollama
    ollama_running = is_port_listening(11434)
    models = []
    if ollama_running:
        try:
            result = subprocess.run(
                ["ollama", "list"], capture_output=True, text=True, timeout=5
            )
            for line in result.stdout.strip().split("\n")[1:]:  # skip header
                if line.strip():
                    models.append(line.split()[0].split(":")[0])
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
    infra["ollama"] = {
        "status": "running" if ollama_running else "stopped",
        "models": models,
    }

    # MySQL (Docker)
    mysql_running = is_port_listening(3306)
    infra["mysql"] = {
        "status": "running" if mysql_running else "stopped",
        "port": 3306,
    }

    # OpenClaw Gateway
    openclaw_running = is_port_listening(18789)
    infra["openclaw_gateway"] = {
        "status": "running" if openclaw_running else "stopped",
        "port": 18789,
    }

    return infra


# ── Commands ────────────────────────────────────────────────────────────────


def cmd_preflight():
    """Check environment prerequisites."""
    print("=" * 60)
    print("  Stanford Town — Preflight Check")
    print("=" * 60)
    issues = []
    fixes = []

    # Node.js via nvm
    print("\n[Node.js]")
    for ver in ["18", "22"]:
        node_bin = get_nvm_node_bin(ver)
        if node_bin:
            print(f"  ✅ Node {ver}: {node_bin}")
        else:
            print(f"  ❌ Node {ver}: not installed")
            issues.append(f"Node {ver} not installed")
            fixes.append(f"nvm install {ver}")

    # pnpm
    print("\n[pnpm]")
    pnpm_path = subprocess.run(
        ["which", "pnpm"], capture_output=True, text=True
    ).stdout.strip()
    if pnpm_path:
        print(f"  ✅ pnpm: {pnpm_path}")
    else:
        print(f"  ❌ pnpm: not installed")
        issues.append("pnpm not installed")
        fixes.append("npm install -g pnpm")

    # Conda environments
    print("\n[Conda]")
    for env_name in ["worldcraft", "agentsims"]:
        result = subprocess.run(
            [str(CONDA_BIN), "env", "list", "--json"],
            capture_output=True,
            text=True,
        )
        try:
            envs = json.loads(result.stdout).get("envs", [])
            found = any(env_name in e for e in envs)
        except json.JSONDecodeError:
            found = False
        if found:
            print(f"  ✅ conda env '{env_name}': exists")
        else:
            print(f"  ❌ conda env '{env_name}': missing")
            issues.append(f"Conda env '{env_name}' missing")
            py_ver = "3.11" if env_name == "worldcraft" else "3.9"
            fixes.append(
                f"conda create -n {env_name} python={py_ver} -y"
            )

    # Ollama
    print("\n[Ollama]")
    if is_port_listening(11434):
        print("  ✅ Ollama: running")
        # Check models
        try:
            result = subprocess.run(
                ["ollama", "list"], capture_output=True, text=True, timeout=5
            )
            models = []
            for line in result.stdout.strip().split("\n")[1:]:
                if line.strip():
                    models.append(line.split()[0])
            if models:
                print(f"  ✅ Models: {', '.join(models)}")
            for needed in ["llama3", "mxbai-embed-large"]:
                if not any(needed in m for m in models):
                    issues.append(f"Ollama model '{needed}' not pulled")
                    fixes.append(f"ollama pull {needed}")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
    else:
        print("  ❌ Ollama: not running")
        issues.append("Ollama not running")
        fixes.append("ollama serve  # (in background)")

    # Docker / MySQL
    print("\n[Docker / MySQL]")
    docker_ok = (
        subprocess.run(
            ["docker", "info"], capture_output=True, text=True
        ).returncode
        == 0
    )
    if docker_ok:
        print("  ✅ Docker: running")
    else:
        print("  ❌ Docker: not running")
        issues.append("Docker not running")
        fixes.append("open -a Docker")

    if is_port_listening(3306):
        print("  ✅ MySQL: running (port 3306)")
    else:
        print("  ⚠️  MySQL: not running")
        issues.append("MySQL not running")
        fixes.append(
            f"cd {ROOT_DIR} && docker compose up -d"
        )

    # OpenClaw Gateway
    print("\n[OpenClaw Gateway]")
    if is_port_listening(18789):
        print("  ✅ OpenClaw Gateway: running (port 18789)")
    else:
        print("  ⚠️  OpenClaw Gateway: not running (optional)")

    # Project directories
    print("\n[Projects]")
    for proj in load_projects():
        proj_dir = ROOT_DIR / proj["path"]
        status = check_setup(proj)
        icon = "✅" if status == "installed" else ("⚠️" if status == "cloned" else "❌")
        print(f"  {icon} {proj['display']}: {status} ({proj_dir})")

    # Summary
    print("\n" + "=" * 60)
    if not issues:
        print("  ✅ All checks passed!")
    else:
        print(f"  ❌ {len(issues)} issue(s) found:\n")
        for i, (issue, fix) in enumerate(zip(issues, fixes), 1):
            print(f"  {i}. {issue}")
            print(f"     Fix: {fix}\n")
    print("=" * 60)
    return len(issues)


def cmd_start(name, all_flag=False):
    """Start a project or all auto projects."""
    projects = load_projects()

    if all_flag:
        targets = [p for p in projects if p["automation"] == "auto"]
        print(f"Starting {len(targets)} auto projects...")
        for proj in targets:
            _start_one(proj)
        # Report manual projects
        manual = [p for p in projects if p["automation"] == "manual"]
        if manual:
            print(f"\n⚠️  Manual projects (not auto-started):")
            for p in manual:
                blockers = get_blockers(p)
                b_str = f" — blockers: {', '.join(blockers)}" if blockers else ""
                print(f"   - {p['display']}{b_str}")
        return

    proj = get_project(name)
    if not proj:
        print(f"❌ Unknown project: {name}")
        print(f"   Available: {', '.join(p['name'] for p in projects)}")
        sys.exit(1)

    _start_one(proj)


def _start_one(proj):
    """Start a single project."""
    name = proj["name"]
    proj_dir = ROOT_DIR / proj["path"]
    port = proj.get("port", proj["default_port"])

    print(f"\n{'─' * 40}")
    print(f"Starting {proj['display']}...")

    # Check if already running
    pid, _ = read_pid(name)
    if is_pid_alive(pid):
        print(f"  ⚠️  Already running (PID {pid})")
        return

    # Check setup
    setup = check_setup(proj)
    if setup == "missing":
        print(f"  ❌ Project not found at {proj_dir}")
        print(f"     Clone it first, then run again.")
        return

    # Check credentials
    cred = check_credentials(proj)
    blockers = get_blockers(proj)
    if blockers:
        print(f"  ⚠️  Blockers: {', '.join(blockers)}")
        if proj["automation"] == "manual":
            print(f"  ℹ️  This is a manual project. Resolve blockers and start manually.")
            return

    # Check port conflict
    if is_port_listening(port):
        print(f"  ❌ Port {port} already in use!")
        return

    # Build environment
    env = os.environ.copy()

    # Load env file
    env_file = LAB_DIR / "env" / f"{name}.env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()

    # Build command
    if proj["runtime"] == "node":
        node_bin = get_nvm_node_bin(proj["runtime_version"])
        if not node_bin:
            print(f"  ❌ Node {proj['runtime_version']} not installed via nvm")
            print(f"     Fix: nvm install {proj['runtime_version']}")
            return
        # Prepend node bin to PATH
        env["PATH"] = f"{node_bin}:{env.get('PATH', '')}"
        cmd = [proj["entry"]] + proj["args"]
    elif proj["runtime"] == "conda":
        cmd = [
            str(CONDA_BIN),
            "run",
            "-n",
            proj["runtime_version"],
            proj["entry"],
        ] + proj["args"]
    else:
        cmd = [proj["entry"]] + proj["args"]

    # Ensure log/run dirs exist
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    RUN_DIR.mkdir(parents=True, exist_ok=True)

    # Open log files
    stdout_log = open(LOG_DIR / f"{name}.out.log", "a")
    stderr_log = open(LOG_DIR / f"{name}.err.log", "a")

    # Write separator
    ts = datetime.now().isoformat()
    stdout_log.write(f"\n{'=' * 40}\n[{ts}] Starting {name}\n{'=' * 40}\n")
    stdout_log.flush()
    stderr_log.write(f"\n{'=' * 40}\n[{ts}] Starting {name}\n{'=' * 40}\n")
    stderr_log.flush()

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(proj_dir),
            env=env,
            stdout=stdout_log,
            stderr=stderr_log,
            preexec_fn=os.setpgrp,
        )
    except FileNotFoundError as e:
        print(f"  ❌ Command not found: {e}")
        stdout_log.close()
        stderr_log.close()
        return

    pgid = os.getpgid(proc.pid)

    # Write pid file
    pid_file = get_pid_file(name)
    pid_file.write_text(json.dumps({"pid": proc.pid, "pgid": pgid}))

    print(f"  ✅ Started (PID {proc.pid}, PGID {pgid})")
    print(f"     Port: {port}")
    print(f"     Logs: {LOG_DIR / f'{name}.out.log'}")

    # Brief wait and check
    time.sleep(1)
    if not is_pid_alive(proc.pid):
        print(f"  ❌ Process died immediately! Check error log:")
        print(f"     {LOG_DIR / f'{name}.err.log'}")


def cmd_stop(name, all_flag=False):
    """Stop a project or all projects."""
    if all_flag:
        projects = load_projects()
        for proj in projects:
            _stop_one(proj["name"])
        return

    proj = get_project(name)
    if not proj:
        print(f"❌ Unknown project: {name}")
        sys.exit(1)
    _stop_one(name)


def _stop_one(name):
    """Stop a single project by killing its process group."""
    pid, pgid = read_pid(name)
    if not is_pid_alive(pid):
        pid_file = get_pid_file(name)
        if pid_file.exists():
            pid_file.unlink()
        return

    print(f"Stopping {name} (PGID {pgid})...")
    try:
        os.killpg(pgid, signal.SIGTERM)
        # Wait up to 5 seconds for graceful shutdown
        for _ in range(10):
            if not is_pid_alive(pid):
                break
            time.sleep(0.5)
        else:
            # Force kill
            print(f"  ⚠️  Sending SIGKILL to {name}...")
            os.killpg(pgid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass

    pid_file = get_pid_file(name)
    if pid_file.exists():
        pid_file.unlink()
    print(f"  ✅ Stopped {name}")


def cmd_status():
    """Generate status.json and print summary."""
    projects = load_projects()
    project_status = {}

    for proj in projects:
        runtime, pid, port = get_runtime_status(proj)
        project_status[proj["name"]] = {
            "display": proj["display"],
            "setup": check_setup(proj),
            "credentials": check_credentials(proj),
            "runtime": runtime,
            "port": port,
            "pid": pid,
            "blockers": get_blockers(proj),
            "automation": proj.get("automation", "auto"),
            "cost": proj.get("cost", "free"),
        }

    infra = check_infra()

    status = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "projects": project_status,
        "infra": infra,
    }

    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False))

    # Print summary table
    print("=" * 70)
    print("  Stanford Town — Status")
    print("=" * 70)

    print(f"\n{'Project':<25} {'Setup':<10} {'Creds':<8} {'Runtime':<12} {'Port':<6}")
    print("─" * 70)
    for name, st in project_status.items():
        setup_icon = {"installed": "✅", "cloned": "⚠️", "missing": "❌"}.get(
            st["setup"], "?"
        )
        cred_icon = {"ok": "✅", "missing": "❌"}.get(st["credentials"], "?")
        runtime_icon = {
            "healthy": "🟢",
            "unhealthy": "🟡",
            "starting": "🔵",
            "stopped": "⚫",
            "port_in_use": "🔴",
        }.get(st["runtime"], "?")
        print(
            f"  {st['display']:<23} {setup_icon} {st['setup']:<8} "
            f"{cred_icon} {st['credentials']:<6} "
            f"{runtime_icon} {st['runtime']:<10} {st['port']}"
        )
        if st["blockers"]:
            print(f"    └─ blockers: {', '.join(st['blockers'])}")

    print(f"\n{'Infrastructure':<25} {'Status':<10}")
    print("─" * 40)
    for name, info in infra.items():
        icon = "🟢" if info["status"] == "running" else "⚫"
        extra = ""
        if "models" in info and info["models"]:
            extra = f" (models: {', '.join(info['models'])})"
        if "port" in info:
            extra += f" :{info['port']}"
        print(f"  {name:<23} {icon} {info['status']}{extra}")

    print(f"\n  Status written to: {STATUS_FILE}")
    print("=" * 70)


def cmd_dashboard():
    """Start the dashboard web server."""
    dashboard_dir = LAB_DIR / "dashboard"

    # Generate fresh status first
    cmd_status()
    print(f"\n🌐 Starting dashboard on http://localhost:{DASHBOARD_PORT}")
    print("   Press Ctrl+C to stop\n")

    # Copy status.json to dashboard dir for serving
    import shutil

    shutil.copy2(STATUS_FILE, dashboard_dir / "status.json")

    os.chdir(dashboard_dir)

    class DashboardHandler(SimpleHTTPRequestHandler):
        def do_GET(self):
            # Refresh status.json on each request
            if self.path == "/status.json" or self.path == "/api/status":
                cmd_status_quiet()
                shutil.copy2(STATUS_FILE, dashboard_dir / "status.json")
                self.path = "/status.json"
            super().do_GET()

        def log_message(self, format, *args):
            pass  # Suppress access logs

    def cmd_status_quiet():
        """Generate status.json without printing."""
        projects = load_projects()
        project_status = {}
        for proj in projects:
            runtime, pid, port = get_runtime_status(proj)
            project_status[proj["name"]] = {
                "display": proj["display"],
                "setup": check_setup(proj),
                "credentials": check_credentials(proj),
                "runtime": runtime,
                "port": port,
                "pid": pid,
                "blockers": get_blockers(proj),
                "automation": proj.get("automation", "auto"),
                "cost": proj.get("cost", "free"),
            }
        infra = check_infra()
        status = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "projects": project_status,
            "infra": infra,
        }
        STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False))

    try:
        httpd = HTTPServer(("0.0.0.0", DASHBOARD_PORT), DashboardHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Dashboard stopped.")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 lab.py <command> [args]")
        print()
        print("Commands:")
        print("  preflight          Check environment prerequisites")
        print("  start <name|--all> Start a project or all auto projects")
        print("  stop  <name|--all> Stop a project or all projects")
        print("  status             Show status and generate status.json")
        print("  dashboard          Start dashboard web server (port 4000)")
        print()
        print("Projects: ai-town, agent-town, worldcraft, agentsims")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "preflight":
        sys.exit(cmd_preflight())
    elif cmd == "start":
        if len(sys.argv) < 3:
            print("Usage: python3 lab.py start <name|--all>")
            sys.exit(1)
        if sys.argv[2] == "--all":
            cmd_start(None, all_flag=True)
        else:
            cmd_start(sys.argv[2])
    elif cmd == "stop":
        if len(sys.argv) < 3:
            print("Usage: python3 lab.py stop <name|--all>")
            sys.exit(1)
        if sys.argv[2] == "--all":
            cmd_stop(None, all_flag=True)
        else:
            cmd_stop(sys.argv[2])
    elif cmd == "status":
        cmd_status()
    elif cmd == "dashboard":
        cmd_dashboard()
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
