Add-Type -AssemblyName System.Drawing

function Generate-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $c1 = [System.Drawing.ColorTranslator]::FromHtml('#4f46e5')
    $c2 = [System.Drawing.ColorTranslator]::FromHtml('#06b6d4')
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
    $g.FillRectangle($brush, $rect)

    # Play triangle in center
    $scale = [float]($size / 512.0)
    $p1 = New-Object System.Drawing.PointF([float](200.0 * $scale), [float](140.0 * $scale))
    $p2 = New-Object System.Drawing.PointF([float](360.0 * $scale), [float](235.0 * $scale))
    $p3 = New-Object System.Drawing.PointF([float](200.0 * $scale), [float](330.0 * $scale))
    $points = [System.Drawing.PointF[]]@($p1, $p2, $p3)
    
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPolygon($whiteBrush, $points)

    # Cyan spark dot
    $cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#38bdf8'))
    $g.FillEllipse($cyanBrush, [float](370.0 * $scale), [float](130.0 * $scale), [float](34.0 * $scale), [float](34.0 * $scale))

    # Streaming wave line
    $wavePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#ec4899'), [float](18.0 * $scale))
    $wavePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $wavePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $wp1 = New-Object System.Drawing.PointF([float](110.0 * $scale), [float](380.0 * $scale))
    $wp2 = New-Object System.Drawing.PointF([float](210.0 * $scale), [float](360.0 * $scale))
    $wp3 = New-Object System.Drawing.PointF([float](310.0 * $scale), [float](400.0 * $scale))
    $wp4 = New-Object System.Drawing.PointF([float](410.0 * $scale), [float](360.0 * $scale))
    $g.DrawBezier($wavePen, $wp1, $wp2, $wp3, $wp4)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated $path"
}

Generate-Icon 192 "client/public/pwa-192x192.png"
Generate-Icon 512 "client/public/pwa-512x512.png"
Generate-Icon 180 "client/public/apple-touch-icon.png"
