/**
 * Arquivo no qual manipulamos as funções dos arquivos APIWrapper.js e SCOFunctions.js,
 *  adicionando nossa funcionalidade
 * 
 * Editado por: Kelivn Costa 07/11/2024
 * Contato: okelvincosta@gmail.com
 * 
 * Criado originalmente: Péricles
 */


// Pega API
var scormAPI = getAPIHandle();

const LESSON_STATUS = {
  notAttempted: "not attempted",
  incomplete: "incomplete",
  completed: "completed",
  passed: "passed",
  failed: "failed",
};

const FIELDS = {
  lessonLocation: "cmi.core.lesson_location",
  lessonStatus: "cmi.core.lesson_status",
  suspendData: "cmi.suspend_data",
  studentName: "cmi.core.student_name",
  scoreRaw: "cmi.core.score.raw",
};

var studentName;
var suspendData;
var studentScore;
var topicIsFinished;


/**
 * Inicializa o evento de carregamento da janela. Se o scormAPI existir, ele registra o API e carrega a página.
 * Em seguida, define um intervalo para verificar se o LMS está inicializado e, se estiver, inicializa a visualização.
 * Por fim, registra um ouvinte de eventos para o clique no elemento "finishButton", que chama a função saveSuspendData.
 *
 * @return {void}
 */
window.onload = function () {
  // Se a API existir carregará a página
  if (scormAPI) {
    console.log("API EXISTE");

    // Puxa do SCOFunctions.js
    // Lá dentro inicia a API e trata os erros
    // Por fim, carrega a página
    
    // // Executa a função loadPage que vai iniciar a comunicação com LMS através da API
    loadPage();


    /**
     * Uma vez que a comunicação é iniciada em loadPage(),
     * queremos verificar periodicamente se ela ainda está em andamento.
     * 
     * O método setInterval vai verificar periodicamente se o LMS está iniciado através da função.
     * Ou se o LMS não estiver iniciado, o intervalo irá verificar novamente.
     * Estando iniciado, o intervalo não irá mais verificar.
     */
    var interval = setInterval(function () {
      console.log('setInterval');
      if (LMSIsInitialized()) {
        clearInterval(interval);
        initView();
      }
    });

    // Registra os eventos de clique para concluir o curso
    var buttonFinish = document.getElementById("finishButton");
   
    if (buttonFinish) {
      buttonFinish.addEventListener("click", () => {
        finishTopic();
        saveSuspendData(suspendData);
      });
    }
  }
};

/**
 * Configura um ouvinte de evento de janela para o evento `beforeunload`.
 * Esta função verifica se a `scormAPI` está disponível e chama a função `unloadPage`.
 *
 * @return {void} Esta função não retorna um valor.
 */
window.onbeforeunload = function () {
  if (scormAPI) unloadPage();
};

/**
 * Inicializa a visualização ao recuperar os dados do aluno.
 * Verifica se o tópico foi concluído.
 * Atualizar o elemento do nome do aluno no documento.
 *
 * @return {void} Esta função não retorna um valor.
 */
function initView() {
  studentName = getScormData(FIELDS.studentName);
  // True ou False dependendo
  topicIsFinished = getScormData(FIELDS.lessonStatus) == LESSON_STATUS.completed;
  // Essa linha está recuperando o valor do campo "cmi.suspend_data" do SCORM API e armazenando-o na variável
  suspendData = getScormData(FIELDS.suspendData);

  if (document.getElementById("studentName")) {
    document.getElementById("studentName").innerHTML = studentName;
  }
}

/**
 * Recupera dados do SCORM API, se disponível.
 *
 * @param {string} field - O campo a partir do qual recuperar os dados.
 * @return {string|undefined} O valor do campo do SCORM API, ou indefinido se o SCORM API não estiver disponível.
 */
function getScormData(field) {
  if (scormAPI) {
    return doLMSGetValue(field);
  }
}

/**
 * Define os dados do SCORM para um determinado campo, se a API do SCORM estiver disponível.
 *
 * @param {string} field - O campo para o qual definir os dados.
 * @param {any} value - O valor a ser definido para o campo.
 * @param {boolean} commit - Se deve fazer o commit das alterações imediatamente.
 * @return {void} Esta função não retorna um valor.
 */
function setScormData(field, value, commit) {
  if (scormAPI) {
    doLMSSetValue(field, value);

    if (commit) {
      doLMSCommit("");
    }
  }
}


/**
 * útil quando você precisa armazenar informações temporárias ou dados que não são críticos para o progresso do curso,
 * mas que devem ser salvos em caso de interrupção da sessão.
 *
 */
function saveSuspendData(value) {
  // campo livre para armazenar qualquer informação que desejar
  setScormData(FIELDS.suspendData, value, true);
}

/**
 * Finaliza o tópico atual se ainda não foi finalizado, definindo os dados SCORM.
 *
 */
function finishTopic() {
  console.log("função finishTopic");
  // Se o curso ainda não foi concluído , salva o status do curso e conclui o tópico
  if (!topicIsFinished) {
    setScormData(FIELDS.lessonStatus, LESSON_STATUS.completed, true);
    // evitar que a função finishTopic tente finalizar o tópico novamente em chamadas subsequentes.
    topicIsFinished = true;
    console.log("Tópico finalizado == btn pressed");
  }
}

