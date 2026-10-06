import { useState, useMemo } from 'react'
import { Printer, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate, formatarCpfCnpj } from '@/lib/format'
import type { Contrato } from '@/services/contratos'

export interface MinutaContratoDialogProps {
  contrato: Contrato | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const OPCOES_MINUTA_PADRAO = [
  { id: 'residencial_fiador', rotulo: '1. Locação Residencial com Fiador' },
  { id: 'residencial_caucao', rotulo: '2. Locação Residencial com Caução' },
  { id: 'residencial_sem_garantia', rotulo: '3. Locação Residencial sem Garantia' },
  { id: 'comercial_fiador', rotulo: '4. Locação Comercial com Fiador' },
  { id: 'comercial_caucao', rotulo: '5. Locação Comercial com Caução' },
  { id: 'comercial_sem_garantia', rotulo: '6. Locação Comercial sem Garantia' },
]

export function MinutaContratoDialog({
  contrato,
  open,
  onOpenChange,
}: MinutaContratoDialogProps) {
  // Configuração padrão de testemunhas instrumentárias (Art. 784, III CPC)
  const [testemunha1, setTestemunha1] = useState({
    nome: '',
    cpf: '',
    email: '',
  })
  const [testemunha2, setTestemunha2] = useState({
    nome: '',
    cpf: '',
    email: '',
  })

  // Detecta modelo sugerido a partir do contrato
  const modeloInicial = useMemo(() => {
    if (!contrato) return 'residencial_caucao'
    const garantia = (contrato.tipo_garantia || '').toLowerCase()
    const isFiador = garantia.includes('fiador')
    const isCaucao = garantia.includes('caução') || garantia.includes('caucao')

    if (isFiador) return 'residencial_fiador'
    if (isCaucao) return 'residencial_caucao'
    return 'residencial_sem_garantia'
  }, [contrato])

  const [modeloSelecionado, setModeloSelecionado] = useState(modeloInicial)

  // Cálculo de meses totais e proporcionais
  const mesesTotais = useMemo(() => {
    if (!contrato?.data_inicio || !contrato?.data_fim) return 12
    const dIni = new Date(contrato.data_inicio)
    const dFim = new Date(contrato.data_fim)
    const diffMeses =
      (dFim.getFullYear() - dIni.getFullYear()) * 12 +
      (dFim.getMonth() - dIni.getMonth())
    return diffMeses > 0 ? diffMeses : 12
  }, [contrato?.data_inicio, contrato?.data_fim])

  if (!contrato) return null

  const locador = contrato.expand?.locador_id as any
  const inquilino = contrato.expand?.inquilino as any
  const imovel = contrato.expand?.imovel as any
  const unidade = contrato.expand?.unidade_id as any
  const fiador = contrato.expand?.fiador_id as any

  // Determina se é residencial ou comercial
  const isComercial = modeloSelecionado.startsWith('comercial')
  const isGarantiaFiador = modeloSelecionado.endsWith('fiador')
  const isGarantiaCaucao = modeloSelecionado.endsWith('caucao')

  // Cálculo da Multa Rescisória (Art. 4º da Lei 8.245/91)
  const valorAluguel = Number(contrato.valor_aluguel) || 0
  const multaIntegral = valorAluguel * 3

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
        {/* Barra Superior - Oculta na Impressão */}
        <DialogHeader className="print:hidden border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
                <FileText className="h-5 w-5 text-indigo-600" />
                Minuta de Contrato de Locação
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Número do Contrato: <span className="font-semibold">{contrato.numero || 'S/N'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={modeloSelecionado}
                onValueChange={setModeloSelecionado}
              >
                <SelectTrigger className="w-[260px] text-xs h-9 bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_MINUTA_PADRAO.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs">
                      {opt.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 h-9 text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Configuração de Testemunhas - Oculta na Impressão */}
        <div className="print:hidden rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2 text-xs">
          <p className="font-semibold text-slate-800">
            Dados das Testemunhas Instrumentárias para Assinatura Eletrônica (Art. 784, III CPC)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 p-2 rounded bg-white border border-slate-200">
              <span className="font-medium text-slate-700">Testemunha 1</span>
              <Input
                placeholder="Nome completo"
                value={testemunha1.nome}
                onChange={(e) =>
                  setTestemunha1((p) => ({ ...p, nome: e.target.value }))
                }
                className="h-8 text-xs bg-slate-50/50"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  placeholder="CPF"
                  value={testemunha1.cpf}
                  onChange={(e) =>
                    setTestemunha1((p) => ({ ...p, cpf: e.target.value }))
                  }
                  className="h-8 text-xs bg-slate-50/50"
                />
                <Input
                  placeholder="E-mail (assinatura digital)"
                  value={testemunha1.email}
                  onChange={(e) =>
                    setTestemunha1((p) => ({ ...p, email: e.target.value }))
                  }
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>
            </div>

            <div className="space-y-1.5 p-2 rounded bg-white border border-slate-200">
              <span className="font-medium text-slate-700">Testemunha 2</span>
              <Input
                placeholder="Nome completo"
                value={testemunha2.nome}
                onChange={(e) =>
                  setTestemunha2((p) => ({ ...p, nome: e.target.value }))
                }
                className="h-8 text-xs bg-slate-50/50"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  placeholder="CPF"
                  value={testemunha2.cpf}
                  onChange={(e) =>
                    setTestemunha2((p) => ({ ...p, cpf: e.target.value }))
                  }
                  className="h-8 text-xs bg-slate-50/50"
                />
                <Input
                  placeholder="E-mail (assinatura digital)"
                  value={testemunha2.email}
                  onChange={(e) =>
                    setTestemunha2((p) => ({ ...p, email: e.target.value }))
                  }
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Corpo do Contrato / Minuta Imprimível */}
        <div className="minuta-conteudo font-serif text-slate-900 leading-relaxed text-sm space-y-4 print:text-black print:leading-normal">
          <div className="text-center space-y-1 pb-3 border-b border-slate-300">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
              INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO{' '}
              {isComercial ? 'COMERCIAL' : 'RESIDENCIAL'}
            </h2>
            <p className="text-xs text-slate-600 font-sans">
              Contrato nº {contrato.numero || '____/____'} • Conforme Lei nº 8.245/1991
            </p>
          </div>

          {/* Qualificação das Partes */}
          <div className="space-y-3 text-justify">
            <p className="font-bold uppercase text-xs tracking-wider text-slate-800 font-sans">
              I. QUALIFICAÇÃO DAS PARTES
            </p>

            <div className="pl-3 border-l-2 border-slate-300 space-y-2">
              <p>
                <strong className="font-sans">LOCADOR(A):</strong>{' '}
                {locador?.nome_razao_social || '___________________________'}, inscrito(a) no{' '}
                {locador?.tipo_pessoa === 'pj' ? 'CNPJ' : 'CPF'} sob o nº{' '}
                {formatarCpfCnpj(locador?.cpf_cnpj) || '_________________'}, com e-mail para
                notificações e assinatura eletrônica:{' '}
                <strong className="font-sans text-indigo-900 underline">
                  {locador?.email || 'e-mail não informado'}
                </strong>
                {locador?.telefone ? `, telefone: ${locador.telefone}` : ''}
                {locador?.dados_bancarios ? `, dados bancários para repasse: ${locador.dados_bancarios}` : ''}.
              </p>

              <p>
                <strong className="font-sans">LOCATÁRIO(A):</strong>{' '}
                {inquilino?.nome || '___________________________'}, inscrito(a) no{' '}
                {inquilino?.tipo_pessoa === 'pj' ? 'CNPJ' : 'CPF'} sob o nº{' '}
                {formatarCpfCnpj(inquilino?.cpf || inquilino?.cnpj) || '_________________'}
                {inquilino?.rg ? `, RG nº ${inquilino.rg}` : ''}, com e-mail para notificações e
                assinatura eletrônica:{' '}
                <strong className="font-sans text-indigo-900 underline">
                  {inquilino?.email || 'e-mail não informado'}
                </strong>
                {inquilino?.telefone ? `, telefone: ${inquilino.telefone}` : ''}
                {inquilino?.endereco ? `, endereço residencial: ${inquilino.endereco}` : ''}
                {inquilino?.endereco_secundario
                  ? `, endereço secundário (${inquilino.endereco_secundario_origem || 'contato'}): ${inquilino.endereco_secundario}`
                  : ''}
                .
              </p>

              {isGarantiaFiador && (
                <p>
                  <strong className="font-sans">FIADOR(A):</strong>{' '}
                  {fiador?.nome || '___________________________'}, inscrito(a) no CPF sob o nº{' '}
                  {formatarCpfCnpj(fiador?.cpf) || '_________________'}
                  {fiador?.rg ? `, RG nº ${fiador.rg}` : ''}
                  {fiador?.estado_civil ? `, estado civil: ${fiador.estado_civil}` : ''}
                  {fiador?.conjuge_nome
                    ? `, com a expressa outorga conjugal de seu cônjuge ${fiador.conjuge_nome}, inscrito(a) no CPF sob nº ${formatarCpfCnpj(fiador.conjuge_cpf) || '____'}`
                    : ''}
                  , com e-mail oficial para assinatura eletrônica:{' '}
                  <strong className="font-sans text-indigo-900 underline">
                    {fiador?.email || 'e-mail não informado'}
                  </strong>
                  {fiador?.telefone ? `, telefone: ${fiador.telefone}` : ''}
                  {fiador?.endereco_completo
                    ? `, residente e domiciliado(a) em: ${fiador.endereco_completo}`
                    : ''}
                  .
                </p>
              )}
            </div>
          </div>

          {/* Cláusulas do Contrato */}
          <div className="space-y-3 text-justify">
            <p className="font-bold uppercase text-xs tracking-wider text-slate-800 font-sans">
              II. CLÁUSULAS CONTRATUAIS
            </p>

            <p>
              <strong>CLÁUSULA PRIMEIRA – DO OBJETO DA LOCAÇÃO:</strong> O presente contrato tem por
              objeto a locação do imóvel situado em{' '}
              <strong>
                {imovel?.endereco || '___________________________'}
                {imovel?.numero ? `, nº ${imovel.numero}` : ''}
                {imovel?.bairro ? `, ${imovel.bairro}` : ''}
                {imovel?.cidade ? `, ${imovel.cidade}` : ''}
                {imovel?.estado ? `/${imovel.estado}` : ''}
              </strong>
              {unidade?.identificador ? `, correspondente à unidade específica "${unidade.identificador}"` : ''}
              {unidade?.complemento ? ` (${unidade.complemento})` : ''}
              {imovel?.matricula ? `, Matrícula nº ${imovel.matricula}` : ''}
              {imovel?.cib ? `, CIB nº ${imovel.cib}` : ''}
              , destinado exclusivamente para fins{' '}
              <strong>{isComercial ? 'comerciais' : 'residenciais'}</strong>.
            </p>

            <p>
              <strong>CLÁUSULA SEGUNDA – DO PRAZO DE VIGÊNCIA:</strong> O prazo desta locação é de{' '}
              <strong>{mesesTotais} meses</strong>, com início em{' '}
              <strong>{formatDate(contrato.data_inicio)}</strong> e término improrrogável em{' '}
              <strong>{formatDate(contrato.data_fim)}</strong>, data em que o(a) LOCATÁRIO(A) se obriga a restituir o imóvel inteiramente desocupado e nas mesmas condições em que o recebeu.
            </p>

            <p>
              <strong>CLÁUSULA TERCEIRA – DO VALOR DO ALUGUEL E REAJUSTE:</strong> O aluguel mensal é
              livremente convencionado no valor de{' '}
              <strong>{formatCurrency(valorAluguel)}</strong>, com vencimento no dia{' '}
              <strong>{contrato.dia_vencimento || '10'}</strong> de cada mês civil.
              {contrato.indice_reajuste && (
                <span>
                  {' '}O aluguel será reajustado anualmente com base na variação acumulada do{' '}
                  <strong>{contrato.indice_reajuste}</strong> ou índice oficial que venha a substituí-lo.
                </span>
              )}
            </p>

            <p>
              <strong>CLÁUSULA QUARTA – DOS ENCARGOS, CONSUMO E TAXAS:</strong> Caberá ao(à)
              LOCATÁRIO(A) o pagamento pontual das despesas de consumo direto de energia elétrica
              {unidade?.codigo_energia ? ` (Instalação/Relógio nº ${unidade.codigo_energia})` : ''}
              , água e esgoto
              {unidade?.codigo_agua ? ` (Hidrômetro nº ${unidade.codigo_agua})` : ''}
              {unidade?.tem_condominio ? `, condomínio mensal no valor de ${formatCurrency(unidade.valor_condominio)}` : ''}
              {unidade?.taxa_poco != null ? `, taxa de poço/manutenção no valor de ${formatCurrency(unidade.taxa_poco)}` : ''}
              , além do IPTU e tributos municipais incidentes sobre o imóvel durante o período locatício.
            </p>

            <p>
              <strong>CLÁUSULA QUINTA – DA GARANTIA LOCATÍCIA:</strong>{' '}
              {isGarantiaFiador && (
                <span>
                  Como garantia da pontual liquidação de todas as obrigações contratuais, comparece e
                  assina como FIADOR(A) solidário(a) o(a) qualificado(a) no preâmbulo, renunciando expressamente aos benefícios dos arts. 827, 835 e 838 do Código Civil.
                </span>
              )}
              {isGarantiaCaucao && (
                <span>
                  A garantia locatícia é prestada por meio de CAUÇÃO no valor de{' '}
                  <strong>{formatCurrency(contrato.valor_garantia || valorAluguel * 3)}</strong>, depositada na conta indicada pelo LOCADOR e a ser restituída ao término da locação após quitação integral das obrigações.
                </span>
              )}
              {!isGarantiaFiador && !isGarantiaCaucao && (
                <span>
                  A presente locação é contratada SEM GARANTIA locatícia, sujeitando-se às disposições do art. 59, § 1º, inciso IX da Lei 8.245/1991.
                </span>
              )}
            </p>

            <p>
              <strong>CLÁUSULA SEXTA – DA MULTA RESCISÓRIA PROPORCIONAL:</strong> Em cumprimento ao
              Artigo 4º da Lei Federal nº 8.245/1991, fica estipulada a multa rescisória contratual
              equivalente a <strong>3 (três) meses de aluguel</strong> ({formatCurrency(multaIntegral)}), a qual será cobrada{' '}
              <strong>proporcionalmente ao período restante de cumprimento do contrato</strong> caso o(a) LOCATÁRIO(A) venha a devolver o imóvel antes do término do prazo pactuado.
            </p>

            <p>
              <strong>CLÁUSULA SÉTIMA – DAS ASSINATURAS E NOTIFICAÇÕES ELETRÔNICAS:</strong> As
              partes convencionam expressamente a plena validade jurídica e eficácia probatória das
              assinaturas digitais apostas eletronicamente neste instrumento, emitidas via e-mail e plataformas de assinatura eletrônica nos termos da MP 2.200-2/2001 e Lei nº 14.063/2020.
            </p>
          </div>

          {/* Seção de Assinaturas */}
          <div className="pt-6 space-y-8 page-break-inside-avoid">
            <p className="text-center text-xs font-sans text-slate-600">
              E, por estarem justas e contratadas, as partes assinam o presente contrato digitalmente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs font-sans pt-4">
              <div className="border-t border-slate-400 pt-2 space-y-1">
                <p className="font-bold">{locador?.nome_razao_social || 'LOCADOR(A)'}</p>
                <p className="text-slate-600">{formatarCpfCnpj(locador?.cpf_cnpj)}</p>
                <p className="text-[11px] text-indigo-700 italic">{locador?.email || 'Assinatura Digital por E-mail'}</p>
              </div>

              <div className="border-t border-slate-400 pt-2 space-y-1">
                <p className="font-bold">{inquilino?.nome || 'LOCATÁRIO(A)'}</p>
                <p className="text-slate-600">{formatarCpfCnpj(inquilino?.cpf || inquilino?.cnpj)}</p>
                <p className="text-[11px] text-indigo-700 italic">{inquilino?.email || 'Assinatura Digital por E-mail'}</p>
              </div>

              {isGarantiaFiador && fiador && (
                <div className="border-t border-slate-400 pt-2 space-y-1 sm:col-span-2 max-w-sm mx-auto">
                  <p className="font-bold">{fiador.nome} (FIADOR)</p>
                  <p className="text-slate-600">{formatarCpfCnpj(fiador.cpf)}</p>
                  <p className="text-[11px] text-indigo-700 italic">{fiador.email || 'Assinatura Digital por E-mail'}</p>
                  {fiador.conjuge_nome && (
                    <p className="text-[11px] text-slate-600 pt-1">
                      Anuência do Cônjuge: {fiador.conjuge_nome} ({formatarCpfCnpj(fiador.conjuge_cpf)})
                    </p>
                  )}
                </div>
              )}

              {/* Testemunhas */}
              <div className="border-t border-slate-400 pt-2 space-y-1">
                <p className="font-bold">
                  {testemunha1.nome || 'TESTEMUNHA 1'}
                </p>
                <p className="text-slate-600">{testemunha1.cpf ? formatarCpfCnpj(testemunha1.cpf) : 'CPF: _________________'}</p>
                <p className="text-[11px] text-indigo-700 italic">
                  {testemunha1.email || 'E-mail para assinatura'}
                </p>
              </div>

              <div className="border-t border-slate-400 pt-2 space-y-1">
                <p className="font-bold">
                  {testemunha2.nome || 'TESTEMUNHA 2'}
                </p>
                <p className="text-slate-600">{testemunha2.cpf ? formatarCpfCnpj(testemunha2.cpf) : 'CPF: _________________'}</p>
                <p className="text-[11px] text-indigo-700 italic">
                  {testemunha2.email || 'E-mail para assinatura'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden border-t border-slate-200 pt-4 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Fechar
          </Button>
          <Button
            onClick={handlePrint}
            className="w-full sm:w-auto min-h-[44px] bg-indigo-600 hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir ou Salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
