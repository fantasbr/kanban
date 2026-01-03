import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBranding } from '@/hooks/useBranding'
import { toast } from 'sonner'
import { Upload, Image, FileImage } from 'lucide-react'

export function BrandingSettings() {
  const { branding, uploadLogo, uploadFavicon, updateBranding, isUploading } = useBranding()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    try {
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)

      // Upload
      const url = await uploadLogo(file)
      await updateBranding({ logo_url: url })
      
      toast.success('Logo atualizado com sucesso!')
    } catch (error: unknown) {
      toast.error('Erro ao fazer upload do logo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    if (file.size > 512 * 1024) {
      toast.error('O favicon deve ter no máximo 512KB')
      return
    }

    try {
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => setFaviconPreview(reader.result as string)
      reader.readAsDataURL(file)

      // Upload
      const url = await uploadFavicon(file)
      await updateBranding({ favicon_url: url })
      
      toast.success('Favicon atualizado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao fazer upload do favicon: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logotipo do Sistema
          </CardTitle>
          <CardDescription>
            Faça upload do logotipo que será exibido no sidebar. Recomendado: 200x50px (PNG, JPG ou SVG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          {(logoPreview || branding?.logo_url) && (
            <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
              <img
                src={logoPreview || branding?.logo_url || ''}
                alt="Logo Preview"
                className="max-h-16 object-contain"
              />
            </div>
          )}

          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Selecionar Logo</Label>
            <div className="flex gap-2">
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading}
                className="flex-1"
              />
              <Button disabled={isUploading} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Tamanho máximo: 2MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Faça upload do favicon que será exibido na aba do navegador. Recomendado: 32x32px (ICO ou PNG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          {(faviconPreview || branding?.favicon_url) && (
            <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
              <img
                src={faviconPreview || branding?.favicon_url || ''}
                alt="Favicon Preview"
                className="h-8 w-8 object-contain"
              />
            </div>
          )}

          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="favicon-upload">Selecionar Favicon</Label>
            <div className="flex gap-2">
              <Input
                id="favicon-upload"
                type="file"
                accept="image/*,.ico"
                onChange={handleFaviconUpload}
                disabled={isUploading}
                className="flex-1"
              />
              <Button disabled={isUploading} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Tamanho máximo: 512KB
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
