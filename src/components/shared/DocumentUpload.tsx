import { useState, useEffect, useCallback } from 'react'
import { Upload, Trash2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import dados from '@/lib/dados/cliente'
import { getDocumentos, createDocumento, deleteDocumento } from '@/services/documentos'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LinkDeArquivo } from '@/components/shared/ArquivoPrivado'

interface DocumentUploadProps {
  entidadeTipo: string
  entidadeId: string
}

export function DocumentUpload({ entidadeTipo, entidadeId }: DocumentUploadProps) {
  const [docs, setDocs] = useState<any[]>([])
  const [descricao, setDescricao] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      setDocs(await getDocumentos(entidadeTipo, entidadeId))
    } catch {
      /* ignore */
    }
  }, [entidadeTipo, entidadeId])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('documentos_anexos', () => {
    load()
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('entidade_tipo', entidadeTipo)
      fd.append('entidade_id', entidadeId)
      fd.append('arquivo', file)
      fd.append('descricao', descricao)
      fd.append('status', 'ativo')
      await createDocumento(fd)
      setFile(null)
      setDescricao('')
      toast.success('Documento anexado com sucesso.')
    } catch {
      toast.error('Não foi possível anexar o documento. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDocumento(id)
      toast.success('Documento removido com sucesso.')
    } catch {
      toast.error('Não foi possível remover o documento. Tente novamente.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-end flex-wrap">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-xs w-full sm:w-auto"
        />
        <Input
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="flex-1 min-w-[150px] bg-slate-50/50"
        />
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
      {docs.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">Nenhum documento anexado.</p>
      ) : (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50/50"
            >
              <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
              <LinkDeArquivo
                tabela="documentos_anexos"
                campo="arquivo"
                caminho={doc.arquivo}
                className="text-xs font-medium text-indigo-600 hover:underline truncate flex-1"
              >
                {doc.descricao || doc.arquivo}
              </LinkDeArquivo>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
