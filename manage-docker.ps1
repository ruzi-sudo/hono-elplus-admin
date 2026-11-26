[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'restart', 'stop', 'status', 'logs')]
    [string]$Action = 'start',

    [switch]$Build
)

$ErrorActionPreference = 'Stop'
$ProjectDirectory = $PSScriptRoot
$ComposeDirectory = Join-Path $ProjectDirectory 'docker'
$ComposeFile = Join-Path $ComposeDirectory 'docker-compose.yml'

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & docker compose --project-directory $ComposeDirectory -f $ComposeFile @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose 执行失败，退出码: $LASTEXITCODE"
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw '未找到 docker 命令，请先安装 Docker Desktop 并启动 Docker Engine。'
}

if (-not (Test-Path -LiteralPath $ComposeFile)) {
    throw "未找到 Compose 文件: $ComposeFile"
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Engine 未运行，请先启动 Docker Desktop。'
}

switch ($Action) {
    'start' {
        $arguments = @('up', '-d')
        if ($Build) {
            $arguments += '--build'
        }
        Invoke-Compose -Arguments $arguments
    }
    'restart' {
        $arguments = @('up', '-d', '--force-recreate')
        if ($Build) {
            $arguments += '--build'
        }
        Invoke-Compose -Arguments $arguments
    }
    'stop' {
        Invoke-Compose -Arguments @('stop')
    }
    'status' {
        Invoke-Compose -Arguments @('ps', '-a')
    }
    'logs' {
        Invoke-Compose -Arguments @('logs', '-f')
    }
}
