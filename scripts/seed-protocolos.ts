/**
 * Script de seed dos protocolos clínicos e conteúdo institucional do ITC Vertebral.
 * Popula a tabela `protocolos` no Supabase via /api/ingest.
 *
 * Uso: npx tsx scripts/seed-protocolos.ts
 *
 * O servidor Next.js precisa estar rodando (npm run dev) antes de executar.
 */

const BASE_URL = "http://localhost:3000";

interface Protocolo {
  titulo: string;
  conteudo: string;
}

const protocolos: Protocolo[] = [
  // ─── INSTITUCIONAL ────────────────────────────────────────────────
  {
    titulo: "Sobre o ITC Vertebral",
    conteudo: `O ITC Vertebral é um instituto especializado em tratamento não cirúrgico da coluna vertebral, fundado em 2005. Atendeu mais de 115 mil pacientes em mais de 80 unidades no Brasil. Faz parte do Grupo Velas, o maior grupo de franquias de fisioterapia da América Latina, com mais de 150 clínicas e presença em 49 cidades brasileiras.

O ITC oferece tratamento exclusivo para coluna sem cirurgia e com tecnologia avançada. A abordagem é conservadora, baseada em terapia manual, exercícios específicos, orientação e educação do paciente. O atendimento é personalizado — cada paciente recebe atenção individualizada de um especialista, sem divisão de atenção entre múltiplos clientes.

O grupo também inclui o Instituto Trata, especializado em reabilitação de joelho, quadril e pé, com mais de 83 mil pacientes atendidos em 70 unidades, utilizando tecnologia exclusiva TrataScan.`,
  },

  {
    titulo: "Grupo Velas — Sobre a empresa",
    conteudo: `O Grupo Velas é o maior grupo de franquias de fisioterapia da América Latina, fundado pelo Dr. Helder Montenegro (CEO), fisioterapeuta especialista em coluna vertebral. O diretor técnico do Instituto Trata é o Dr. Thiago Fukuda, especialista em reabilitação musculoesquelética.

Números do grupo: mais de 1 milhão de pacientes atendidos, 150+ clínicas (45 próprias e demais franqueadas), presença em 49 cidades brasileiras. Reconhecido como a 5ª melhor franquia para investir no país na área de saúde e bem-estar.

Marcas do grupo: ITC Vertebral (coluna vertebral), Instituto Trata (joelho, quadril e pé), SCAL (plataforma de gestão de clínicas com análise de dados).

Missão: transformar vidas através da fisioterapia baseada em evidências científicas, com tecnologias avançadas incluindo IA Watson e algoritmos de avaliação clínica.`,
  },

  // ─── METODOLOGIA E TRATAMENTO ─────────────────────────────────────
  {
    titulo: "Metodologia de Tratamento — ITC Vertebral",
    conteudo: `O tratamento do ITC Vertebral é baseado em protocolos científicos validados internacionalmente, originados em pesquisas de Pittsburgh e confirmados por cientistas globais. A metodologia é conservadora — sem cirurgia — e combina múltiplas técnicas:

Terapia Manual: restaura a funcionalidade e a biomecânica das estruturas musculoesqueléticas, buscando movimento máximo e indolor.

Método McKenzie: identifica preferências de movimento individuais de cada paciente através de análise, ensinando exercícios específicos para uso diário.

Programas de Fortalecimento: fortalecimento muscular personalizado conforme o tipo de sintoma e diagnóstico de cada paciente.

Intervenções Mecânicas: mesas de tração para descompressão vertebral controlada; mesas de flexo-extensão que permitem controle completo da mobilidade vertebral (flexão, extensão, inclinação lateral e rotação).

Processo Diagnóstico: avaliação detalhada com uso de inteligência artificial para alinhamento diagnóstico, permitindo indicar a melhor conduta a ser seguida.

O primeiro passo é sempre passar por uma avaliação conservadora especializada. O tratamento é específico para as necessidades de cada indivíduo, normalmente começando com abordagens analgésicas combinadas com exercícios e orientações para casa.`,
  },

  // ─── PROTOCOLOS CLÍNICOS ──────────────────────────────────────────
  {
    titulo: "Protocolo Clínico — Hérnia de Disco e Coluna Lombar",
    conteudo: `Hérnia de disco é uma das condições mais tratadas no ITC Vertebral. O tratamento é não cirúrgico e conservador.

Urgência ALTA: dor lombar com irradiação para membros inferiores (ciática), dormência ou formigamento nas pernas ou pés, perda de força nos membros inferiores, retenção ou incontinência urinária associada à dor lombar. Nesses casos, recomenda-se avaliação médica urgente ou pronto-socorro.

Urgência MÉDIA: dor lombar com irradiação leve, dor que piora progressivamente há mais de 2 semanas, limitação de movimento significativa. Recomendado agendamento de consulta em 48-72h.

Urgência BAIXA: dor lombar aguda sem irradiação, início recente (menos de 72h), dor mecânica que melhora com repouso. Orientações: manter-se ativo (repouso absoluto não é recomendado), aplicar calor local, evitar movimentos de flexão extrema. Agendar consulta eletiva.

Hérnias de disco não tratadas podem se tornar crônicas — quanto mais crônico, mais fraqueza, dor e incapacidade o paciente terá. O tratamento conservador especializado deve ser o primeiro passo antes de considerar qualquer cirurgia.`,
  },

  {
    titulo: "Protocolo Clínico — Dor Cervical e Coluna Cervical",
    conteudo: `Dor cervical (pescoço) é uma das queixas mais comuns tratadas no ITC Vertebral.

Urgência ALTA: dor cervical com irradiação para membros superiores (braços, mãos), dormência ou formigamento nos dedos, fraqueza nos braços, dor de cabeça intensa e súbita associada à cervicalgia, trauma recente no pescoço.

Urgência MÉDIA: dor cervical persistente há mais de 2 semanas, limitação de rotação do pescoço, tensão muscular intensa. Agendamento em 48-72h recomendado.

Urgência BAIXA: tensão cervical, dor após postura inadequada prolongada (trabalho no computador), sem irradiação. Orientações: pausas a cada 30 minutos, alongamentos cervicais, ajuste ergonômico da estação de trabalho.

É possível trabalhar sentado sem dor — existem estratégias específicas ensinadas durante o tratamento no ITC Vertebral para quem trabalha em escritório.`,
  },

  {
    titulo: "Protocolo Clínico — Dor no Joelho",
    conteudo: `Dor no joelho é tratada pelo Instituto Trata, parte do Grupo Velas, com tecnologia exclusiva TrataScan.

Urgência ALTA: dor joelho com inchaço súbito e intenso, impossibilidade de apoiar o peso no joelho, deformidade visível, trauma direto recente (queda, torção), bloqueio articular (joelho que trava). Avaliação médica urgente necessária.

Urgência MÉDIA: dor ao subir e descer escadas, dor ao agachar, dor persistente há mais de 2 semanas, crepitações (estalos) com dor associada. Agendar consulta em 48-72h.

Urgência BAIXA: desconforto leve após atividade física, rigidez matinal breve, dor que cede com repouso. Orientar fortalecimento muscular, controle de peso e atividade de baixo impacto.

Condições comuns tratadas: condromalácia patelar, síndrome patelofemoral, lesões de menisco, gonartrose (artrose de joelho), tendinopatia patelar.`,
  },

  {
    titulo: "Protocolo Clínico — Dor no Quadril",
    conteudo: `Dor no quadril é tratada pelo Instituto Trata, especializado em reabilitação de quadril, joelho e pé.

Urgência ALTA: dor quadril após queda ou trauma direto (especialmente em idosos — suspeita de fratura), dor intensa com impossibilidade de caminhar, febre associada à dor articular (suspeita de artrite séptica). Encaminhar para pronto-socorro.

Urgência MÉDIA: dor que irradia para a virilha ou coxa, dor ao caminhar longas distâncias, limitação de amplitude de movimento do quadril, dor há mais de 2 semanas. Agendar consulta em 48-72h.

Urgência BAIXA: dor leve após atividade física, desconforto ao ficar sentado por longos períodos, rigidez matinal breve. Orientar alongamentos de flexores do quadril, fortalecimento de glúteos, controle de atividade.

Condições comuns tratadas: artrose de quadril (coxartrose), bursite trocantérica, síndrome do impacto femoroacetabular, tendinopatia dos adutores.`,
  },

  {
    titulo: "Protocolo Clínico — Ciática e Dor Irradiada",
    conteudo: `Ciática é a dor que se irradia da lombar pelo nervo ciático, descendo pela nádega, coxa, perna e pé. É um dos sintomas mais comuns tratados no ITC Vertebral.

Urgência ALTA: dor ciática com perda de força nas pernas, incontinência urinária ou fecal, dormência intensa na região genital ou nas duas pernas simultaneamente (síndrome da cauda equina — emergência cirúrgica). Encaminhar imediatamente ao pronto-socorro.

Urgência MÉDIA: dor ciática moderada (4-7/10) com irradiação até o pé, há mais de 2 semanas, sem perda de força. Agendar consulta em 48h.

Urgência BAIXA: dor ciática leve (1-3/10), recente, sem irradiação completa. Orientar repouso relativo, calor lombar, evitar flexão da coluna com carga.

Depoimento de paciente ITC: "Morria de dor no ciático. E nunca mais tive uma dorzinha, o ITC corrigiu totalmente meu corpo."`,
  },

  // ─── FAQ ──────────────────────────────────────────────────────────
  {
    titulo: "Perguntas Frequentes — ITC Vertebral",
    conteudo: `P: O que acontece se a hérnia de disco não for tratada?
R: Os problemas podem ficar crônicos, e quanto mais crônico, mais fraqueza, dor e incapacidade o paciente vai ter. O tratamento conservador deve ser iniciado o quanto antes.

P: Como funciona o tratamento?
R: O tratamento é específico para as necessidades de cada indivíduo, mas normalmente começamos com abordagens analgésicas juntamente com exercícios e orientações para casa.

P: Posso ser atendido durante uma crise aguda?
R: Sim, na realidade é até melhor para uma avaliação mais criteriosa. O ITC recebe pacientes em fase de crise.

P: Qual a diferença do tratamento do ITC para o tratamento médico convencional?
R: O tratamento médico envolve medicamento e cirurgia. Nosso tratamento é conservador, baseado em terapia manual, exercícios específicos, orientação e educação do paciente — sem cirurgia.

P: O que fazer após o tratamento?
R: Você vai precisar dar continuidade em tudo o que foi proposto durante seu tratamento, sendo a atividade física o melhor caminho para manter os resultados.

P: Quanto tempo leva para melhorar?
R: Depende da fase da condição. Casos agudos tendem a melhorar mais rápido que casos crônicos. Uma avaliação presencial é necessária para estimar o tempo de tratamento.

P: Posso trabalhar sentado sem dor?
R: Sim, é possível. Existem estratégias específicas que ensinamos durante o tratamento para quem trabalha em escritório.

P: Qual o primeiro passo para tratar minha dor?
R: O primeiro passo é passar por uma avaliação conservadora especializada no ITC Vertebral.`,
  },

  // ─── AGENDAMENTO ──────────────────────────────────────────────────
  {
    titulo: "Informações de Agendamento e Unidades",
    conteudo: `O ITC Vertebral possui mais de 80 unidades espalhadas pelo Brasil, em 49 cidades. Para agendar uma consulta, o paciente pode:

1. Solicitar agendamento diretamente com a Valéria (assistente virtual) informando nome completo, data de preferência e período (manhã ou tarde).
2. Buscar a unidade mais próxima pelo site itcvertebral.com.br.

A primeira consulta é uma avaliação especializada completa, onde o fisioterapeuta irá analisar os sintomas, aplicar testes clínicos e utilizar inteligência artificial para diagnóstico. A partir da avaliação, um plano de tratamento individualizado é elaborado.

O atendimento é personalizado — um terapeuta dedicado por paciente, sem divisão de atenção.

Perfil de pacientes atendidos: todas as faixas etárias, de crianças com problemas posturais a idosos com dor crônica, atletas em recuperação e trabalhadores com lesões ocupacionais.`,
  },
];

async function ingerir(protocolo: Protocolo): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(protocolo),
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`✓ ${protocolo.titulo}`);
  } else {
    console.error(`✗ ${protocolo.titulo} — ${data.error}`);
  }
}

async function main() {
  console.log(`\nIniciando seed de ${protocolos.length} protocolos...\n`);

  for (const protocolo of protocolos) {
    await ingerir(protocolo);
    // Pequena pausa para não sobrecarregar
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\nSeed concluído!");
}

main().catch(console.error);
