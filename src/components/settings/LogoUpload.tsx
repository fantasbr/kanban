import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface LogoUploadProps {
  currentLogoUrl: string | null
  onLogoChange: (url: string | null) => void
  companyId: number
}

export function LogoUpload({ currentLogoUrl, onLogoChange, companyId }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    setUploading(true)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${companyId}-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('pdf-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-logos')
        .getPublicUrl(data.path)

      setPreviewUrl(publicUrl)
      onLogoChange(publicUrl)
      toast.success('Logo enviado com sucesso!')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Erro ao enviar logo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!previewUrl) return

    try {
      // Extract file path from URL
      const urlParts = previewUrl.split('/pdf-logos/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        
        // Delete from storage
        await supabase.storage
          .from('pdf-logos')
          .remove([`logos/${filePath}`])
      }

      setPreviewUrl(null)
      onLogoChange(null)
      toast.success('Logo removido com sucesso!')
    } catch (error) {
      console.error('Error removing logo:', error)
      toast.error('Erro ao remover logo')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Logo da Empresa</Label>
        <p className="text-sm text-slate-600">
          Tamanho recomendado: <strong>400x150 pixels</strong> (proporção 8:3)
          <br />
          Formatos aceitos: PNG, JPG, SVG | Tamanho máximo: 2MB
        </p>
      </div>

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative w-full max-w-md border rounded-lg p-4 bg-slate-50">
            <img
              src={previewUrl}
              alt="Logo preview"
              className="w-full h-auto max-h-32 object-contain"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveLogo}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label
              htmlFor="logo-upload"
              className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col items-center gap-2 text-slate-600">
                {uploading ? (
                  <>
                    <Upload className="h-8 w-8 animate-pulse" />
                    <span className="text-sm">Enviando...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-sm font-medium">Clique para selecionar logo</span>
                    <span className="text-xs text-slate-500">ou arraste e solte aqui</span>
                  </>
                )}
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
