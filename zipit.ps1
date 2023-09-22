$files = @{
    Path            = "css", "images", "scripts", "manifest.json", "readme.md"
    DestinationPath = "~\Downloads\lae.zip"
}
Compress-Archive @files
