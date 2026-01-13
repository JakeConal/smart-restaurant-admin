$files = @(
    "src/admin-auth/admin-auth.service.ts",
    "src/auth/auth.controller.ts",
    "src/menu-item-photo/menu-item-photo.controller.ts",
    "src/profile/profile.controller.ts",
    "src/table/table.controller.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Fix admin-auth.service.ts
        if ($file -eq "src/admin-auth/admin-auth.service.ts") {
            $content = $content -replace "req\?\.ip(?!=)", "(req as any)?.ip"
            $content = $content -replace "req\?\.headers\['user-agent'\]", "(req as any)?.headers?.['user-agent']"
        }
        
        # Fix Response methods in controllers
        if ($file -match "controller\.ts") {
            # Fix res.status
            $content = $content -replace "res\.status\(", "(res as any).status("
            # Fix res.send
            $content = $content -replace "res\.send\(", "(res as any).send("
            # Fix res.set
            $content = $content -replace "res\.set\(", "(res as any).set("
            # Fix res.setHeader
            $content = $content -replace "res\.setHeader\(", "(res as any).setHeader("
            # Fix res.redirect
            $content = $content -replace "res\.redirect\(", "(res as any).redirect("
            # Fix res.pipe - special case
            $content = $content -replace "zipStream\.pipe\(res\)", "zipStream.pipe(res as any)"
        }
        
        $content | Set-Content $file
        Write-Host "Fixed $file"
    }
}
