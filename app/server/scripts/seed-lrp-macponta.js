// Gera uma LRP a partir da simulação "Macponta" e preenche TODAS as respostas
// com os dados reais do documento de LRP da MacPonta. Marca aderência = aderente.
// Uso: node scripts/seed-lrp-macponta.js
import { pool, closePool } from '../src/db/client.js';
import * as lrp from '../src/services/lrp.js';

// Respostas mapeadas pelo TEXTO EXATO da pergunta (igual ao template).
const RESPOSTAS = {
  // Institucional
  'Descreva a história e o propósito da empresa.':
    'A MacPonta Agro foi fundada em julho de 1995 em Ponta Grossa/PR por José Divalsir Gondaski, como uma pequena loja de peças. Em 1996 passou a representar a marca John Deere. Hoje, ao completar 30 anos, conta com mais de 230 colaboradores e 8 unidades no Paraná, representando a John Deere em 70 municípios, atuando com máquinas agrícolas, peças, serviços e tecnologia.',
  'Quais as expectativas do cliente com a aquisição do Clover CRM?':
    'Atualização e modernização do Clover CRM, com foco na gestão do funil de vendas e no acompanhamento do potencial de máquinas dos clientes.',
  // Ferramentas
  'Quais sistemas/ferramentas o cliente utiliza hoje? (ERP, BI, etc.)':
    'ERP Protheus (TOTVS); Clover CRM; ExpertConnect (plataforma John Deere de pós-venda).',
  // Perfil de acesso
  'Quais perfis de acesso serão necessários e qual o objetivo de cada um?':
    'São utilizados os perfis de acesso padrão do Clover CRM: Administrador CRM (administrador do sistema), Gestão (cargos de gestão: diretoria, gerentes, coordenadores, supervisores) e Consultor (cargos operacionais: consultores e representantes de vendas).',
  'Há necessidade de perfis além do padrão (Administrador, Gerente, Consultor)? Qual a diferença de acessos?':
    'Não. São utilizados apenas os perfis padrão do Clover CRM.',
  // Grupo empresarial, empresa e filial
  'A empresa é composta por quantas unidades entre matriz e filial? Identifique-as com seus códigos.':
    'Três matrizes: MACPONTA - PONTA GROSSA; MACPONTA CAMINHÕES - PONTA GROSSA; e GRUPO GONDASKI. Cada uma possui suas respectivas filiais vinculadas.',
  'O cadastro de empresa e filial será integrado?': 'Sim',
  'Qual o CNPJ e o código da matriz principal?':
    'CNPJ da matriz principal MACPONTA - PONTA GROSSA: 00.702.079/0001-00.',
  'A base cadastral poderá ser compartilhada entre as empresas e filiais? Detalhe.':
    'O cadastro de empresa e filial continuará sendo integrado ao Clover CRM, sendo necessário enviar na integração a empresa (matriz) também como filial para os respectivos vínculos dentro do Clover CRM.',
  // Cadastro de usuário
  'Quantos usuários utilizarão o Clover CRM?': 'Foram adquiridas 30 licenças para uso do Clover CRM.',
  'O cadastro de usuário será integrado? (Se SOLUTION, obrigatório)': 'Não',
  'Todos os usuários a integrar possuem endereço de e-mail?': 'Sim',
  'Qual a senha a ser utilizada para o primeiro acesso?':
    'macponta@123, com atualização obrigatória no primeiro acesso do usuário ao ambiente Web.',
  // Lead, prospect
  'Clientes em potencial são cadastrados inicialmente como leads?': 'Sim',
  'Quais as etapas utilizadas para um lead até sua conversão?':
    'Novo lead; 1º contato; Qualificação; Descartado.',
  'A conversão de um lead é feita para prospect ou diretamente para parceiro?':
    'A conversão de um lead é feita para prospect ou cliente. Quando o parceiro é cadastrado pelo Clover CRM, a gestão de conflito de cadastros é feita periodicamente.',
  // Cadastro de parceiro
  'Será integrado todo o cadastro de parceiro ou apenas os ativos? Quantos parceiros ativos com movimentação?':
    'O cadastro de cliente continuará sendo integrado — atualmente pouco mais de 17.000 registros. O cadastro de local/endereço também continuará integrado, com pouco mais de 23.000 registros.',
  'Existe o vínculo de parceiro superior (grupo familiar)?': 'Não',
  'Existe distinção entre local de cobrança e local de entrega?': 'Não',
  // Classe de produto e produto
  'Quantos níveis de classe de produto? Cite exemplos de cada nível.':
    'O cadastro/manutenção de classe de produto é realizado via Clover CRM — aproximadamente 4.700 registros na base.',
  'O cadastro de produto será integrado? Apenas ativos?':
    'O cadastro/manutenção de produto é realizado via Clover CRM — aproximadamente 7.500 registros. A unidade de medida é integrada do ERP Protheus.',
  'O cadastro contempla máquinas e insumos? Para máquinas, quantos níveis?':
    'Foco em máquinas agrícolas (John Deere). Para máquinas, o Clover utiliza 4 níveis: grupo, marca, linha e família.',
  // Cultura e safra
  'Será integrado o cadastro de cultura? Se não, quais culturas?':
    'O cadastro de cultura é realizado manualmente dentro do Clover CRM.',
  'Será integrado o cadastro de safra? A partir de qual data de vigência?':
    'O cadastro de safra é realizado manualmente dentro do Clover CRM.',
  // Registro de visita
  'A empresa possui estratégia de CRM para diferenciar o atendimento aos clientes?':
    'Tipos de atendimento utilizados: E-mail, Evento, Plano de ação (Tratos Culturais), Presencial, Telefone, Treinamento PGO (CEN’s), Videoconferência e Whatsapp. O formato de planejamento de agenda (semanal/quinzenal) será avaliado futuramente pela equipe Macponta.',
  'Quais serão os serviços prestados pela equipe de campo?':
    'Feira; Pós-Venda; Proposta; Visita Comercial; Prospecção; Entrega Técnica; Demonstração; Pendência Documental; Negociação.',
  'Qual a frequência de lançamento do planejamento de agendas?':
    'Atualmente não existe uma frequência definida de lançamento do planejamento de agendas; será avaliado futuramente. Os atendimentos são realizados por nível de necessidade do cliente.',
  'Os serviços prestados devem ser separados por área de negócio?': 'Não',
  // Funil de vendas
  'Quantos funis serão utilizados?':
    'Dois funis: MACPONTA e MACPONTA OFICIAL. O funil MACPONTA será inativado em 30/06/2026, permanecendo apenas o MACPONTA OFICIAL.',
  'Estão mapeadas as etapas de cada funil?':
    'Funil MACPONTA: Prospecção; Negociação (jdquote); Pedido fechado; Financiamento; Venda ganha (faturado); Venda perdida (concorrência); Venda cancelada. Funil MACPONTA OFICIAL: Prospecção; Negociação/JDquote; Pedido emitido – RP; Pedido emitido – financ; Faturamento.',
  'É possível gerar um pedido a partir de uma oportunidade? Em qual etapa/situação?':
    'No caso de máquinas, é possível adicionar uma máquina usada do inventário do cliente na oportunidade.',
  'Quais os principais motivos de não fechamento?':
    'Preço do concorrente; Disponibilidade de produto; Condições da negociação (usado / banco da fábrica / loja); Crédito negado ao cliente. Principais motivos de objeção: crédito não aprovado, pedido substituído, compra adiada e desistência.',
  'Utiliza termômetro para a oportunidade ou percentual manual?':
    'Utiliza termômetro: Frio 0%-45%, Morno 46%-75% e Quente 76%-100%.',
  // Potencial de máquinas
  'Será realizado o levantamento de inventário de máquinas dos clientes? E da concorrência?':
    'Sim — está sendo integrado o levantamento do inventário de máquinas dos clientes.',
  'Está mapeado o volume de horas por modelo de equipamento para revisão?':
    'Estão cadastradas as avaliações técnica, comercial e financeira (atualmente sem uso de critério de aprovação para as respectivas avaliações).',
  'Está mapeado o valor de peças e mão de obra para revisão/recondicionamento?':
    'A avaliação de máquina usada não está sendo utilizada neste momento; ficou definido com a equipe da Macponta que sua utilização ficará para um segundo momento.',
};

async function main() {
  const { rows: sims } = await pool.query(`SELECT id FROM simulacoes WHERE nome ILIKE 'macponta' ORDER BY id LIMIT 1`);
  if (!sims[0]) throw new Error('Simulação "Macponta" não encontrada.');
  const simId = sims[0].id;

  const { rows: adminRows } = await pool.query(`SELECT id FROM usuarios WHERE papel = 'admin' ORDER BY id LIMIT 1`);
  const adminId = adminRows[0]?.id ?? null;

  const gerada = await lrp.gerarDaSimulacao(simId, adminId);
  console.log(`[seed] LRP gerada: id=${gerada.id} v${gerada.versao} com ${gerada.itens.length} tópicos`);

  // Renomeia para deixar claro que é o exemplo preenchido.
  await pool.query(`UPDATE lrps SET nome = $1 WHERE id = $2`, ['MacPonta — Exemplo preenchido', gerada.id]);

  let preench = 0, semMatch = 0;
  for (const item of gerada.itens) {
    for (const r of item.respostas) {
      const ans = RESPOSTAS[r.pergunta];
      if (ans != null) {
        await pool.query(`UPDATE lrp_respostas SET resposta = $1 WHERE id = $2`, [ans, r.id]);
        preench++;
      } else {
        semMatch++;
        console.warn(`[seed] sem resposta mapeada: "${r.pergunta}"`);
      }
    }
  }
  await pool.query(`UPDATE lrps SET status = 'finalizada', atualizado_em = now() WHERE id = $1`, [gerada.id]);
  console.log(`[seed] OK — ${preench} respostas preenchidas, ${semMatch} sem match. LRP id=${gerada.id} marcada como finalizada.`);
}

main()
  .catch((err) => { console.error('[seed] ERRO:', err.message); process.exitCode = 1; })
  .finally(() => closePool());
