<#
  start.ps1 - local preview server for this static blog.

  WHY THIS FILE EXISTS
    The pages fetch posts/index.json and posts/*.md. Browsers block those
    requests when a page is opened with file://, so double-clicking index.html
    shows an empty board. A tiny http server is the whole fix.

  WHY POWERSHELL
    No Node.js and no build tools (project rule 1), and this PC has no Python.
    System.Net.HttpListener ships with Windows PowerShell 5.1, binds
    http://localhost:<port>/ without administrator rights, and needs no install.

  WHY ASCII ONLY
    Windows PowerShell 5.1 reads a BOM-less .ps1 as ANSI. Non-ASCII text in the
    file itself would be mangled and can break string terminators - a syntax
    error in the one script that is supposed to make previewing easy.
    Korean explanations live in the docs, not here. (Paths printed at runtime
    may contain Korean; that text comes from the filesystem, not from this file.)

  USAGE
    start.bat                 (normal)
    powershell -NoProfile -ExecutionPolicy Bypass -File start.ps1 -Port 5501
#>
param(
  [string]$Root = $PSScriptRoot,
  [int]$Port = 5500,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

if (-not $Root) { $Root = (Get-Location).Path }
$Root = (Resolve-Path -LiteralPath $Root).Path

# Trailing separator matters: without it "C:\blog" would also accept "C:\blog-old".
$RootPrefix = $Root
if (-not $RootPrefix.EndsWith('\')) { $RootPrefix = $RootPrefix + '\' }

# Content types the blog actually serves. Anything else is sent as a download.
# .json and .md must be correct or the board and the posts will not load.
$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'text/javascript; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.md'    = 'text/markdown; charset=utf-8'
  '.txt'   = 'text/plain; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.ico'   = 'image/x-icon'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.gif'   = 'image/gif'
  '.webp'  = 'image/webp'
  '.avif'  = 'image/avif'
  '.woff2' = 'font/woff2'
  '.map'   = 'application/json; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
  $listener.Start()
} catch {
  Write-Host ''
  Write-Host "  [start] Port $Port is not available."
  Write-Host '          Another preview server is probably still running.'
  Write-Host '          Close it, or start this one on another port:'
  Write-Host "            powershell -NoProfile -ExecutionPolicy Bypass -File start.ps1 -Port 5501"
  Write-Host ''
  exit 1
}

$url = "http://localhost:$Port/index.html"
Write-Host ''
Write-Host "  [start] folder  : $Root"
Write-Host "  [start] address : $url"
Write-Host '  [start] stop    : Ctrl+C, or just close this window'
Write-Host ''

if (-not $NoBrowser) {
  try { Start-Process $url | Out-Null } catch { Write-Host "  [start] open this yourself: $url" }
}

try {
  while ($listener.IsListening) {
    # Wait in short slices instead of a single blocking GetContext():
    # PowerShell only reacts to Ctrl+C between statements, so a blocking call
    # would make the window impossible to stop with the keyboard.
    $task = $listener.GetContextAsync()
    while (-not $task.Wait(250)) { }
    $ctx = $task.Result

    $req = $ctx.Request
    $res = $ctx.Response
    try {
      $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
      if ($rel.EndsWith('/')) { $rel = $rel + 'index.html' }
      $rel = $rel.TrimStart('/') -replace '/', '\'

      $full = $null
      $ok = $false
      try {
        $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
        # Refuse anything that climbs out of the project folder (../../secret).
        $inside = $full.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase)
        $ok = $inside -and (Test-Path -LiteralPath $full -PathType Leaf)
      } catch {
        $ok = $false
      }

      if ($ok) {
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
        if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] }
        else { $res.ContentType = 'application/octet-stream' }
        # Preview must never show a stale file: edit, reload, see it.
        $res.AddHeader('Cache-Control', 'no-store')
        $res.StatusCode = 200
      } else {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 - not found: /$rel")
        $res.ContentType = 'text/plain; charset=utf-8'
        $res.StatusCode = 404
      }

      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("  {0}  {1}" -f $res.StatusCode, $req.Url.AbsolutePath)
    } catch {
      # A reload can abort a request mid-write. That is normal; keep serving.
      Write-Host ("  ---  {0}" -f $_.Exception.Message)
    } finally {
      try { $res.OutputStream.Close() } catch { }
      try { $res.Close() } catch { }
    }
  }
} finally {
  try { $listener.Stop() } catch { }
  try { $listener.Close() } catch { }
  Write-Host ''
  Write-Host '  [start] server stopped.'
}
