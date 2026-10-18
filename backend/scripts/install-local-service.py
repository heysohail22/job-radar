"""Replace the legacy timer with one localhost API + scheduler user service."""
from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
uv = shutil.which('uv')
if not uv:
    raise SystemExit('Install uv first.')
service = f'''[Unit]
Description=AI Job Radar Python API and daily collector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory={root}
ExecStart={uv} run --directory {root} --frozen python -m job_radar
Restart=on-failure
RestartSec=10
TimeoutStopSec=100
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target
'''
target = Path.home() / '.config/systemd/user'
target.mkdir(parents=True, exist_ok=True)
(target / 'job-radar-backend.service').write_text(service)
subprocess.run(['systemctl', '--user', 'disable', '--now', 'job-radar-collector.timer'], check=True)
subprocess.run(['systemctl', '--user', 'daemon-reload'], check=True)
subprocess.run(['systemctl', '--user', 'enable', '--now', 'job-radar-backend.service'], check=True)
print('Unified localhost API and scheduler service enabled. Legacy collector timer disabled.')
