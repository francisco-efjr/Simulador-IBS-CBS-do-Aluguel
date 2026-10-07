import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  CircleOff,
  FileQuestion,
  PiggyBank,
  Plus,
  ShieldCheck,
  Shield,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, cantoOrganico, type CantoOrganico } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Combobox } from '@/components/shared/Combobox'
import { DinheiroInput } from '@/components/shared/DinheiroInput'
import { Field } from '@/components/shared/Field'
import { GrupoDePilulas, type OpcaoDaPilula } from '@/components/shared/GrupoDePilulas'
import { ResumoDeErros, type ErroDoResumo } from '@/components/shared/ResumoDeErros'
import { EstadoVazio } from '@/components/organico'
import { FiadorFormDialog } from '@/components/fiadores/FiadorFormDialog'
import { OPCOES_MINUTA_PADRAO } from '@/components/contratos/MinutaContratoDialog'
import { useAuth } from '@/hooks/use-auth'
import {
  createContrato,
  getContrato,
  obterProximoNumeroContrato,
  updateContrato,
  type Contrato,
} from '@/services/contratos'
import { getImoveis, type Imovel } from '@/services/imoveis'
import { getInquilinos } from '@/services/inquilinos'
import { getLocadores, type Locador } from '@/services/locadores'
import { getFiadores, type Fiador } from '@/services/fiadores'
import { getUnidadesPorImovel, type ImovelUnidade } from '@/services/unidades'
import {
  abreviar,
  formatDate,
  formatarCpfCnpj,
  STATUS_CONTRATO_LABELS,
  TIPO_GARANTIA_LABELS,
} from '@/lib/format'
import { extractFieldErrors, type FieldErrors } from '@/lib/dados/erros'
import { contratoSchema, validarFormulario } from '@/lib/validacao/esquemas'
import { MENSAGENS } from '@/lib/mensagens-de-erro'
import { formularioDoRegistro, textoParaNumero } from '@/lib/formulario'
import { paraNumeroEmReais, valorParaCampo } from '@/lib/dinheiro'

const EMPTY = {
  numero: '',
  imovel: '',
  unidade_id: '',
  locador_id: '',
  inquilino: '',
  fiador_id: '',
  minuta_padrao: '',
  data_inicio: '',
  data_fim: '',
  valor_aluguel: '',
  dia_vencimento: '10',
  indice_reajuste: 'IPCA',
  periodicidade_reajuste: 'Anual',
  proxima_data_reajuste: '',
  tipo_garantia: 'sem garantia',
  valor_garantia: '',
  status: 'ativo',
  observacoes: '',
}

const NUM_FIELDS = ['valor_aluguel', 'dia_vencimento', 'valor_garantia']
const CAMPOS_DE_DINHEIRO = ['valor_aluguel', 'valor_garantia']

/** Campos na ordem da tela, com o nome que o resumo de erros mostra. */
const CAMPOS_DO_FORMULARIO: [string, string][] = [
  ['numero', 'Número do contrato'],
  ['status', 'Situação'],
  ['inquilino', 'Inquilino'],
  ['locador_id', 'Locador'],
  ['imovel', 'Imóvel'],
  ['unidade_id', 'Unidade'],
  ['valor_aluguel', 'Aluguel mensal'],
  ['dia_vencimento', 'Dia do vencimento'],
  ['data_inicio', 'Início da vigência'],
  ['data_fim', 'Fim da vigência'],
  ['indice_reajuste', 'Índice de reajuste'],
  ['periodicidade_reajuste', 'Periodicidade do reajuste'],
  ['proxima_data_reajuste', 'Próximo reajuste'],
  ['fiador_id', 'Fiador'],
  ['valor_garantia', 'Valor da garantia'],
  ['observacoes', 'Observações'],
]

const ICONES_DE_GARANTIA: Record<string, OpcaoDaPilula['icone']> = {
  fiador: UserCheck,
  caução: PiggyBank,
  'seguro-fiança': ShieldCheck,
  'título de capitalização': Wallet,
  'sem garantia': CircleOff,
  outros: Shield,
}

const OPCOES_DE_GARANTIA: OpcaoDaPilula[] = Object.entries(TIPO_GARANTIA_LABELS).map(
  ([valor, rotulo]) => ({ valor, rotulo, icone: ICONES_DE_GARANTIA[valor] ?? Shield }),
)

const INDICES = ['IPCA', 'IGP-M']
const PERIODICIDADES = ['Anual', 'Semestral']

/** Nome curto da minuta para caber no seletor: "Residencial com fiador". */
const nomeCurtoDaMinuta = (rotulo: string) =>
  rotulo.replace(/^\d+\.\s*/, '').replace(/^Locação\s+/, '')

/** Cartão de uma seção do formulário (Partes, Imóvel, Valores e prazo, Garantia). */
function SecaoDoFormulario({
  titulo,
  canto,
  children,
}: {
  titulo: string
  canto: CantoOrganico
  children: React.ReactNode
}) {
  return (
    <Card canto={canto} className="flex flex-col gap-[18px] p-5 sm:p-7">
      <h2 className="text-[1.375rem] leading-tight">{titulo}</h2>
      {children}
    </Card>
  )
}

/**
 * Novo contrato e edição de contrato (seção 14 do handoff Fase 2).
 *
 * Era um diálogo; virou página, com trilha, seções em cartões, resumo de erros
 * no topo e botões no rodapé. A lógica é a mesma do diálogo antigo: o mesmo
 * esquema valida, o mesmo payload vai ao serviço, e a minuta padrão ainda
 * sugere a garantia (e a caução).
 */
export default function ContratoFormulario() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const { canEditModule, loading: autenticando } = useAuth()
  const podeEditar = canEditModule('contratos')

  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [tentativa, setTentativa] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroDeCarga, setErroDeCarga] = useState(false)

  // Listas para seleção
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [unidades, setUnidades] = useState<ImovelUnidade[]>([])
  const [inquilinos, setInquilinos] = useState<any[]>([])
  const [locadores, setLocadores] = useState<Locador[]>([])
  const [fiadores, setFiadores] = useState<Fiador[]>([])
  const [contratoAtual, setContratoAtual] = useState<Contrato | null>(null)

  // Cadastro rápido de fiador, sem sair do formulário
  const [fiadorModalOpen, setFiadorModalOpen] = useState(false)
  const [fiadorPendente, setFiadorPendente] = useState<string | null>(null)

  const upd = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }))
    // Quem corrige o campo vê o aviso sair; se o problema continuar, o próximo envio traz de volta.
    setErrors((atuais) => {
      if (!atuais[k]) return atuais
      const { [k]: _corrigido, ...resto } = atuais
      return resto
    })
  }

  // Carrega as listas e, na edição, o contrato; no contrato novo, sugere o número.
  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErroDeCarga(false)
    ;(async () => {
      try {
        const [ims, iqs, locs, fiads, atual] = await Promise.all([
          getImoveis(),
          getInquilinos(),
          getLocadores(),
          getFiadores(),
          id ? getContrato(id) : Promise.resolve(null),
        ])
        if (!ativo) return
        // Imóvel inativo não recebe contrato novo; na edição, o imóvel atual continua na lista.
        setImoveis(ims.filter((im) => im.status !== 'inativo' || im.id === atual?.imovel))
        setInquilinos(iqs)
        setLocadores(locs)
        setFiadores(fiads)
        setContratoAtual(atual)
        if (atual) {
          setForm(
            formularioDoRegistro(
              EMPTY,
              atual as unknown as Record<string, unknown>,
              CAMPOS_DE_DINHEIRO,
            ),
          )
        } else {
          setForm(EMPTY)
          // Sugestão de número sequencial do contrato
          obterProximoNumeroContrato()
            .then((proximo) => {
              if (ativo) setForm((prev) => (prev.numero ? prev : { ...prev, numero: proximo }))
            })
            .catch(() => {})
        }
      } catch {
        if (ativo) setErroDeCarga(true)
      } finally {
        if (ativo) setCarregando(false)
      }
    })()
    return () => {
      ativo = false
    }
  }, [id])

  // Seleciona o fiador recém-cadastrado depois que ele já está na lista (CAD-05).
  useEffect(() => {
    if (fiadorPendente && fiadores.some((f) => f.id === fiadorPendente)) {
      setForm((p) => ({ ...p, fiador_id: fiadorPendente }))
      setFiadorPendente(null)
    }
  }, [fiadores, fiadorPendente])

  // Atualiza as unidades quando o imóvel selecionado mudar
  useEffect(() => {
    if (!form.imovel) {
      setUnidades([])
      return
    }
    let ativo = true
    getUnidadesPorImovel(form.imovel).then((unds) => {
      if (ativo) setUnidades(unds)
    })
    return () => {
      ativo = false
    }
  }, [form.imovel])

  // Só unidade vaga recebe contrato novo; na edição, a unidade atual continua na lista.
  const unidadesVagas = useMemo(
    () => unidades.filter((u) => u.status === 'vago' || u.id === form.unidade_id),
    [unidades, form.unidade_id],
  )

  const locadorEscolhido = locadores.find((l) => l.id === form.locador_id)
  const imovelEscolhido = imoveis.find((i) => i.id === form.imovel)
  const fiadorEscolhido = fiadores.find((f) => f.id === form.fiador_id)

  const opcoesDeInquilino = useMemo(
    () =>
      inquilinos.map((iq) => ({
        valor: iq.id as string,
        rotulo: (iq.nome as string) || '—',
        detalhe: formatarCpfCnpj(iq.cpf || iq.cnpj || '') === '—' ? undefined : formatarCpfCnpj(iq.cpf || iq.cnpj),
      })),
    [inquilinos],
  )

  const comValorAtual = (padrao: string[], atual: string) =>
    atual && !padrao.includes(atual) ? [...padrao, atual] : padrao

  // Trata seleção de Minuta Padrão
  const handleMinutaChange = (minutaId: string) => {
    upd('minuta_padrao', minutaId)
    if (minutaId.endsWith('fiador')) {
      upd('tipo_garantia', 'fiador')
    } else if (minutaId.endsWith('caucao')) {
      upd('tipo_garantia', 'caução')
      if (form.valor_aluguel && !form.valor_garantia) {
        const aluguelNum = paraNumeroEmReais(form.valor_aluguel)
        if (Number.isFinite(aluguelNum) && aluguelNum > 0) {
          upd('valor_garantia', valorParaCampo(Math.round(aluguelNum * 300) / 100))
        }
      }
    } else if (minutaId.endsWith('sem_garantia')) {
      upd('tipo_garantia', 'sem garantia')
      upd('valor_garantia', '')
      upd('fiador_id', '')
    }
  }

  const escolherGarantia = (v: string) => {
    upd('tipo_garantia', v)
    if (v !== 'fiador') upd('fiador_id', '')
    if (v === 'fiador' || v === 'sem garantia') upd('valor_garantia', '')
  }

  const usaFiador = form.tipo_garantia === 'fiador'
  const usaValor = form.tipo_garantia !== 'fiador' && form.tipo_garantia !== 'sem garantia'

  const salvar = async () => {
    setErrors({})
    setTentativa((n) => n + 1)
    const fe = validarFormulario(contratoSchema, form)
    // O catálogo de mensagens (seção 07) diz "precisa ser depois de…" para as datas.
    if (fe.data_fim && form.data_inicio && /anterior/i.test(fe.data_fim)) {
      fe.data_fim = MENSAGENS.dataFinalAntesDaInicial(formatDate(form.data_inicio))
    }
    if (Object.keys(fe).length) {
      setErrors(fe)
      return
    }

    const formatarValor = (k: string, v: string) =>
      NUM_FIELDS.includes(k) ? textoParaNumero(k, v, CAMPOS_DE_DINHEIRO) : v

    // O que a garantia escolhida não usa não vai ao banco (CAD-04): o campo some da
    // tela, mas o valor digitado antes da troca continuaria no formulário.
    const naoUsados: string[] = []
    if (!usaFiador) naoUsados.push('fiador_id')
    if (!usaValor) naoUsados.push('valor_garantia')

    let payload: Record<string, any> | FormData
    if (file) {
      const fd = new FormData()
      for (const [k, v] of Object.entries(form)) {
        if (k === 'status' || k === 'minuta_padrao' || naoUsados.includes(k)) continue
        if (v === '' || v == null) continue
        fd.append(k, NUM_FIELDS.includes(k) ? String(formatarValor(k, v)) : v)
      }
      // Texto vazio no FormData grava nulo: é como o envio com arquivo limpa a coluna.
      for (const k of naoUsados) fd.append(k, '')
      fd.append('status', form.status)
      fd.append('documento', file)
      payload = fd
    } else {
      payload = { status: form.status }
      for (const [k, v] of Object.entries(form)) {
        if (k === 'status' || k === 'minuta_padrao' || naoUsados.includes(k)) continue
        if (v === '' || v == null) continue
        payload[k] = formatarValor(k, v)
      }
      for (const k of naoUsados) payload[k] = null
    }

    setSubmitting(true)
    try {
      if (id) {
        await updateContrato(id, payload)
      } else {
        await createContrato(payload)
      }
      toast.success('Contrato salvo')
      navigate('/contratos')
    } catch (err) {
      const ext = extractFieldErrors(err)
      if (Object.keys(ext).length) {
        setErrors(ext)
      } else {
        toast.error('Não foi possível salvar o contrato', {
          description: 'Confira a internet e os campos, e tente de novo.',
          action: { label: 'Tentar de novo', onClick: () => void salvar() },
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void salvar()
  }

  const errosDoResumo: ErroDoResumo[] = CAMPOS_DO_FORMULARIO.filter(([campo]) => errors[campo]).map(
    ([campo, rotulo]) => ({ campo, rotulo, mensagem: errors[campo] }),
  )

  if (!autenticando && !podeEditar) return <Navigate to="/contratos" replace />

  const titulo = editando ? 'Editar contrato' : 'Novo contrato'

  const trilha = (
    <nav aria-label="Caminho" className="flex flex-wrap items-center gap-1.5 px-2 text-base lg:px-0">
      <Link to="/contratos" className="inline-flex min-h-11 items-center font-bold text-primary underline">
        Contratos
      </Link>
      <ChevronRight className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
      <span aria-current="page" className="text-accent-foreground">
        {titulo}
      </span>
    </nav>
  )

  if (carregando || erroDeCarga) {
    return (
      <div className="flex flex-col gap-5">
        {trilha}
        <h1 className="px-2 text-3xl lg:px-0 lg:text-5xl">{titulo}</h1>
        {erroDeCarga ? (
          <Card className="px-2">
            <EstadoVazio
              icone={FileQuestion}
              titulo="Não foi possível abrir o contrato"
              descricao="Confira a internet ou veja se o contrato ainda existe, e tente de novo."
              acoes={
                <Button asChild>
                  <Link to="/contratos">Voltar para Contratos</Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <div aria-busy="true" className="flex flex-col gap-4">
            <span role="status" className="sr-only">
              Carregando o formulário…
            </span>
            <div aria-hidden="true" className="flex flex-col gap-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-56 w-full rounded-[2rem]" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {trilha}
      <header className="flex flex-col gap-1 px-2 lg:px-0">
        <h1 className="text-3xl lg:text-5xl">{titulo}</h1>
        {contratoAtual?.numero && (
          <p className="numero text-base text-accent-foreground">Contrato {contratoAtual.numero}</p>
        )}
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <ResumoDeErros erros={errosDoResumo} tentativa={tentativa} className="max-w-xl" />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col gap-5 lg:gap-6">
            <SecaoDoFormulario titulo="Contrato" canto={cantoOrganico(0)}>
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                <Field
                  id="numero"
                  label="Número do contrato"
                  error={errors.numero}
                  anunciar={false}
                  hint="O sistema sugere o próximo. Dá para mudar."
                >
                  <Input
                    value={form.numero}
                    onChange={(e) => upd('numero', e.target.value)}
                    className="min-h-14"
                  />
                </Field>
                <Field id="status" label="Situação" error={errors.status} anunciar={false}>
                  <Select value={form.status} onValueChange={(v) => upd('status', v)}>
                    <SelectTrigger className="min-h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONTRATO_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field
                id="documento"
                label="Documento do contrato"
                opcional
                hint="PDF, Word ou foto do contrato assinado."
              >
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="min-h-14 pt-3.5"
                  accept=".pdf,.doc,.docx,image/*"
                />
              </Field>
            </SecaoDoFormulario>

            <SecaoDoFormulario titulo="Partes" canto={cantoOrganico(1)}>
              <Field id="inquilino" label="Inquilino" error={errors.inquilino} anunciar={false}>
                <Combobox
                  opcoes={opcoesDeInquilino}
                  valor={form.inquilino}
                  onValorChange={(v) => upd('inquilino', v)}
                  placeholder="Escolha o inquilino"
                  rotuloDaBusca="Buscar inquilino pelo nome ou documento"
                  className="min-h-14"
                />
              </Field>
              <Field
                id="locador_id"
                label="Locador"
                error={errors.locador_id}
                anunciar={false}
                hint={
                  locadorEscolhido
                    ? [
                        locadorEscolhido.nome_razao_social,
                        locadorEscolhido.cpf_cnpj ? formatarCpfCnpj(locadorEscolhido.cpf_cnpj) : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : undefined
                }
              >
                <Select value={form.locador_id} onValueChange={(v) => upd('locador_id', v)}>
                  <SelectTrigger className="min-h-14">
                    <SelectValue placeholder="Escolha o locador" />
                  </SelectTrigger>
                  <SelectContent>
                    {locadores.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {abreviar(loc.nome_razao_social)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </SecaoDoFormulario>

            <SecaoDoFormulario titulo="Imóvel" canto={cantoOrganico(2)}>
              <Field
                id="imovel"
                label="Imóvel"
                error={errors.imovel}
                anunciar={false}
                hint={imovelEscolhido?.endereco ?? undefined}
              >
                <Select
                  value={form.imovel}
                  onValueChange={(v) => {
                    upd('imovel', v)
                    upd('unidade_id', '') // Limpa unidade ao trocar imóvel
                  }}
                >
                  <SelectTrigger className="min-h-14">
                    <SelectValue placeholder="Escolha o imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    {imoveis.map((im) => (
                      <SelectItem key={im.id} value={im.id}>
                        {abreviar(im.nome || im.endereco || '—')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                id="unidade_id"
                label="Unidade"
                opcional={Boolean(form.imovel) && unidades.length === 0}
                error={errors.unidade_id}
                anunciar={false}
                hint={
                  !form.imovel
                    ? 'Escolha o imóvel primeiro.'
                    : unidades.length === 0
                      ? 'Este imóvel não tem unidades cadastradas (imóvel único).'
                      : unidadesVagas.length === 0
                        ? 'Todas as unidades deste imóvel estão ocupadas.'
                        : 'Só aparecem unidades vagas.'
                }
              >
                <Select
                  value={form.unidade_id}
                  onValueChange={(v) => upd('unidade_id', v)}
                  disabled={!form.imovel || unidadesVagas.length === 0}
                >
                  <SelectTrigger className="min-h-14">
                    <SelectValue placeholder="Escolha a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesVagas.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {abreviar(
                          u.complemento ? `${u.identificador} (${u.complemento})` : u.identificador,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </SecaoDoFormulario>
          </div>

          <div className="flex flex-col gap-5 lg:gap-6">
            <SecaoDoFormulario titulo="Valores e prazo" canto={cantoOrganico(3)}>
              <Field
                id="valor_aluguel"
                label="Aluguel mensal (R$)"
                error={errors.valor_aluguel}
                anunciar={false}
                hint="Use só números, por exemplo 3.500,00"
              >
                <DinheiroInput
                  value={form.valor_aluguel}
                  onValueChange={(v) => upd('valor_aluguel', v)}
                  className="min-h-14"
                />
              </Field>
              <Field
                id="dia_vencimento"
                label="Dia do vencimento"
                error={errors.dia_vencimento}
                anunciar={false}
                hint="Um número de 1 a 31."
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={form.dia_vencimento}
                  onChange={(e) => upd('dia_vencimento', e.target.value)}
                  className="min-h-14"
                />
              </Field>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-[18px]">
                <Field
                  id="data_inicio"
                  label="Início da vigência"
                  error={errors.data_inicio}
                  anunciar={false}
                  hint="dia/mês/ano"
                >
                  <Input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => upd('data_inicio', e.target.value)}
                    className="min-h-14"
                  />
                </Field>
                <Field
                  id="data_fim"
                  label="Fim da vigência"
                  error={errors.data_fim}
                  anunciar={false}
                  hint="dia/mês/ano"
                >
                  <Input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => upd('data_fim', e.target.value)}
                    className="min-h-14"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-[18px]">
                <Field
                  id="indice_reajuste"
                  label="Reajuste pelo índice"
                  error={errors.indice_reajuste}
                  anunciar={false}
                >
                  <Select
                    value={form.indice_reajuste}
                    onValueChange={(v) => upd('indice_reajuste', v)}
                  >
                    <SelectTrigger className="min-h-14">
                      <SelectValue placeholder="Escolha o índice" />
                    </SelectTrigger>
                    <SelectContent>
                      {comValorAtual(INDICES, form.indice_reajuste).map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  id="periodicidade_reajuste"
                  label="Reajuste a cada"
                  error={errors.periodicidade_reajuste}
                  anunciar={false}
                >
                  <Select
                    value={form.periodicidade_reajuste}
                    onValueChange={(v) => upd('periodicidade_reajuste', v)}
                  >
                    <SelectTrigger className="min-h-14">
                      <SelectValue placeholder="Escolha o prazo" />
                    </SelectTrigger>
                    <SelectContent>
                      {comValorAtual(PERIODICIDADES, form.periodicidade_reajuste).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field
                id="proxima_data_reajuste"
                label="Próximo reajuste"
                opcional
                error={errors.proxima_data_reajuste}
                anunciar={false}
                hint="dia/mês/ano"
              >
                <Input
                  type="date"
                  value={form.proxima_data_reajuste}
                  onChange={(e) => upd('proxima_data_reajuste', e.target.value)}
                  className="min-h-14"
                />
              </Field>
            </SecaoDoFormulario>

            <SecaoDoFormulario titulo="Garantia" canto={cantoOrganico(0)}>
              <GrupoDePilulas
                legenda="Tipo de garantia"
                opcoes={OPCOES_DE_GARANTIA}
                valor={form.tipo_garantia}
                onValorChange={escolherGarantia}
              />

              {usaFiador && (
                <div className="flex flex-col gap-1">
                  <Field
                    id="fiador_id"
                    label="Fiador"
                    error={errors.fiador_id}
                    anunciar={false}
                    hint={
                      fiadorEscolhido
                        ? [fiadorEscolhido.nome, fiadorEscolhido.cpf ? formatarCpfCnpj(fiadorEscolhido.cpf) : '']
                            .filter(Boolean)
                            .join(' · ')
                        : 'Não está na lista? Cadastre aqui embaixo.'
                    }
                  >
                    <Select value={form.fiador_id} onValueChange={(v) => upd('fiador_id', v)}>
                      <SelectTrigger className="min-h-14">
                        <SelectValue placeholder="Escolha o fiador" />
                      </SelectTrigger>
                      <SelectContent>
                        {fiadores.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {abreviar(f.nome)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiadorModalOpen(true)}
                    className="self-start"
                  >
                    <Plus aria-hidden="true" /> Cadastrar novo fiador
                  </Button>
                </div>
              )}

              {usaValor && (
                <Field
                  id="valor_garantia"
                  label={
                    form.tipo_garantia === 'caução' ? 'Valor da caução (R$)' : 'Valor da garantia (R$)'
                  }
                  opcional
                  error={errors.valor_garantia}
                  anunciar={false}
                  hint="Use só números, por exemplo 3.500,00"
                >
                  <DinheiroInput
                    value={form.valor_garantia}
                    onValueChange={(v) => upd('valor_garantia', v)}
                    className="min-h-14"
                  />
                </Field>
              )}

              <Field
                id="minuta_padrao"
                label="Modelo da minuta"
                opcional
                hint="Escolher o modelo já marca a garantia que combina com ele."
              >
                <Select value={form.minuta_padrao} onValueChange={handleMinutaChange}>
                  <SelectTrigger className="min-h-14">
                    <SelectValue placeholder="Escolha o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCOES_MINUTA_PADRAO.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {abreviar(nomeCurtoDaMinuta(opt.rotulo))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="observacoes" label="Observações" opcional error={errors.observacoes}>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => upd('observacoes', e.target.value)}
                  rows={3}
                />
              </Field>
            </SecaoDoFormulario>
          </div>
        </div>

        {/* Celular: barra fixa no rodapé; computador: faixa abaixo das seções. */}
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-border/60 bg-card/90 px-4 pb-6 pt-3.5 backdrop-blur-md lg:static lg:mx-0 lg:flex-row lg:justify-end lg:gap-3 lg:border-t lg:border-dashed lg:border-border lg:bg-transparent lg:p-0 lg:pt-5 lg:backdrop-blur-none">
          <Button asChild variant="ghost" size="lg" className="lg:px-6">
            <Link to="/contratos">Cancelar</Link>
          </Button>
          <Button type="submit" size="lg" carregando={submitting} textoCarregando="Salvando…">
            <Check aria-hidden="true" /> Salvar contrato
          </Button>
        </div>
      </form>

      {/* Cadastro rápido de novo fiador */}
      <FiadorFormDialog
        open={fiadorModalOpen}
        onOpenChange={setFiadorModalOpen}
        onSaved={(novoFiador) => {
          if (novoFiador) {
            setFiadores((prev) => [...prev, novoFiador])
            // Selecionar já neste lote faria o Select receber um valor que ainda não
            // tem item na lista e zerá-lo; o efeito acima espera a lista atualizar.
            setFiadorPendente(novoFiador.id)
          }
        }}
      />
    </div>
  )
}
