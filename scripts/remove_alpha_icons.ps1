Add-Type -AssemblyName System.Drawing
$files = @(
    "subscription_icon_monthly_1768652632520",
    "subscription_icon_yearly_1768652647594",
    "subscription_icon_lifetime_1768652661936"
)
$dir = "C:\Users\taiyo\.gemini\antigravity\brain\906f902f-926a-4f9f-b2ce-dae2a41a1986"

foreach ($f in $files) {
    $imagePath = Join-Path $dir "$($f).png"
    $outputPath = Join-Path $dir "$($f)_no_alpha.png"
    
    if (Test-Path $imagePath) {
        $bmp = New-Object System.Drawing.Bitmap($imagePath)
        $newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
        $g = [System.Drawing.Graphics]::FromImage($newBmp)
        $g.Clear([System.Drawing.Color]::White)
        $g.DrawImage($bmp, 0, 0)
        $g.Dispose()
        $bmp.Dispose()
        $newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $newBmp.Dispose()
        Write-Host "Processed: $outputPath"
    }
}
