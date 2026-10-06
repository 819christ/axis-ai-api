$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\ThinkPad\Desktop\Axis AI api'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$exclude = '^(file/|dist/|docs/|\.vscode/|node_modules/)|(package-lock\.json|test-results\.log|LLM\.md|LLM\.old\.md)$|scripts/build-llm-md\.ps1$'
$files = git ls-files -co --exclude-standard | Where-Object { $_ -notmatch $exclude } | Sort-Object -Unique

$header = [IO.File]::ReadAllText('C:\Users\ThinkPad\Desktop\Axis AI api\scripts\llm-header.md', $utf8).TrimStart([char]0xFEFF).Replace("`r`n", "`n") + "`n"

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append($header)
foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath $f -PathType Leaf)) { continue }
    $content = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $f).Path, $utf8)
    $content = $content.TrimStart([char]0xFEFF) -replace "`r`n", "`n"
    [void]$sb.Append("FICHIER: /$f`n`n$($content.TrimEnd())`n`n---`n`n")
}
$utf8bom = New-Object System.Text.UTF8Encoding($true)
[IO.File]::WriteAllText('C:\Users\ThinkPad\Desktop\Axis AI api\LLM.md', ($sb.ToString() -replace "`r`n", "`n"), $utf8bom)
"Fichiers inclus : $($files.Count)"
