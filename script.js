// Função Login
async function login(username, password) {
    const query = `
        mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
                token
                user {
                    id
                }
            }
        }
    `;
    const variables = { username, password };
    
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.data && result.data.login) {
        localStorage.setItem('authToken', result.data.login.token);
        localStorage.setItem('userID', result.data.login.user.id); 
        alert('Login successful!');
        checkLoginStatus();
    } else {
        alert('Error: ' + result.errors[0].message);
    }
}

// Função de login DOM
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    await login(username, password);
});

// Função para criar uma conta nova
async function createAccount(username, password) {
    const query = `
        mutation CreateUser($username: String!, $password: String!) {
            createUser(username: $username, password: $password) {
                id
                username
            }
        }
    `;
    const variables = { username, password };
    
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.data && result.data.createUser) {
        alert('Account created successfully!');
    } else {
        alert('Error creating account: ' + result.errors[0].message);
    }
}

// Função de conta nova DOM
document.getElementById('createAccountLink').addEventListener('click', function() {
    const username = prompt('Enter your username:');
    const password = prompt('Enter your password:');
    if (username && password) {
        createAccount(username, password);
    }
});

// Função se o usuário está logado
function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const userID = localStorage.getItem('userID');
    if (token && userID) {
        document.getElementById('showInfoBtn').disabled = false;
        document.getElementById('showCheckupFormBtn').disabled = false;
        document.getElementById('showResultsBtn').disabled = false;   
    }
}

// Verifica se o bloco está visível DOM
document.getElementById('showInfoBtn').addEventListener('click', function() {
const extraInfo = document.getElementById('extraInfo');
// Verifica se o bloco está visível
if (extraInfo.style.display === 'block') {
extraInfo.style.display = 'none';  
} else {
extraInfo.style.display = 'block'; 
fetchData(); 
}
});


document.getElementById('showCheckupFormBtn').addEventListener('click', function() {
            const checkupBlock = document.getElementById('checkupBlock');
            if (checkupBlock.style.display === 'block') {
                checkupBlock.style.display = 'none';  
            } else {
                checkupBlock.style.display = 'block';  
            }
        });

// Pega na data e submete na base de dados
async function submitData() {
    const userID = localStorage.getItem('userID');
    const ultimaMenstruacao = document.getElementById('ultimaMenstruacao').value;
    const dataFormatada = new Date(ultimaMenstruacao);
    const isoData = dataFormatada.toISOString();  

    const query = `
        mutation CreateGestacao($usuarioId: ID!, $ultimaMenstruacao: String!) {
            createGestacao(usuarioId: $usuarioId, ultimaMenstruacao: $ultimaMenstruacao) {
                id
                ultimaMenstruacao
            }
        }
    `;

    const variables = { usuarioId: userID, ultimaMenstruacao: isoData };

    await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    }); 
    //Depois de meter na base de dados, da refresh
    fetchData();
}

// Função para buscar dados sobre data de gravidez
async function fetchData() {
    const userID = localStorage.getItem('userID');

    const query = `
        query GetGestacao($usuarioId: ID!) {
            gestacaoPorUsuario(usuarioId: $usuarioId) {
                id
                ultimaMenstruacao
                dataTerminoPrevisto
            }
        }
    `;

    const variables = { usuarioId: userID };

    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.data && result.data.gestacaoPorUsuario) {
        const dataTermino = result.data.gestacaoPorUsuario.dataTerminoPrevisto;
        if (!isNaN(dataTermino)) {
            const data = new Date(parseInt(dataTermino));
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            const formattedDate = `${dia}-${mes}-${ano}`;
            document.getElementById('dataTerminoPrevisto').innerText = formattedDate;
        } else {
            console.error('Data inválida:', dataTermino);
            document.getElementById('dataTerminoPrevisto').innerText = "Data inválida.";
        }
    } else {
        console.error("Erro ao buscar dados de gestação:", result.errors);
        document.getElementById('dataTerminoPrevisto').innerText = "Erro ao carregar os dados.";
    }
}

document.getElementById('submitDataBtn').addEventListener('click', submitData)

// Submeter informação sobre o bebe, e devolve dados medios
document.getElementById('submitCheckupBtn').addEventListener('click', async function() {
    const userID = localStorage.getItem('userID');
    const semana = parseInt(document.getElementById('semana').value);
    const peso = parseFloat(document.getElementById('peso').value);
    const comprimento = parseFloat(document.getElementById('comprimento').value);
    const dataRegistro = new Date().toISOString();

    if (!semana || !peso || !comprimento) {
        console.error("Missing input values.");
        alert("Preencha todos os valores.");
        return;
    }

    const queryMedia = `
        query ($semana: Int!) {
            gravidezMediaPorSemana(semana: $semana) {
                peso
                comprimento
                facto
            }
        }
    `;

    try {
        const responseMedia = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryMedia, variables: { semana } })
        });
        
        const resultMedia = await responseMedia.json();
        const semanaData = resultMedia.data.gravidezMediaPorSemana;

        if (semanaData) {
            document.getElementById('semanaAvg').value = semana;
            document.getElementById('pesoAvg').value = semanaData.peso;
            document.getElementById('comprimentoAvg').value = semanaData.comprimento;
            document.getElementById('randomFact').innerHTML = semanaData.facto;
        } else {
            alert("Semana não encontrada.");
        }
    } catch (error) {
        console.error("Erro ao buscar os dados médios:", error);
        alert("Erro ao carregar os dados médios.");
    }

    const mutation = `
        mutation CreateGravidez($usuarioId: ID!, $semana: Int!, $peso: Float!, $comprimento: Float!, $dataRegistro: String!) {
            createGravidez(usuarioId: $usuarioId, semana: $semana, peso: $peso, comprimento: $comprimento, dataRegistro: $dataRegistro) {
                id
                semana
                peso
                comprimento
                dataRegistro
            }
        }
    `;

    try {
        await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: mutation, variables: { usuarioId: userID, semana, peso, comprimento, dataRegistro } })
        });
    } catch (error) {
        console.error("Error during the request:", error);
        alert("An error occurred during the request.");
    }
});


document.getElementById('showResultsBtn').addEventListener('click', function() {
const resultsBLock = document.getElementById('resultsTableContainer');
            if (resultsBLock.style.display === 'block') {
                resultsBLock.style.display = 'none';  
            } else {
                resultsBLock.style.display = 'block'; 
            }
const resultsTableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
resultsTableBody.innerHTML = '';

const userID = localStorage.getItem('userID');

const query = `
query ($usuarioId: ID!) {
    dadosGravidezPorUsuario(usuarioId: $usuarioId) {
        semana
        peso
        comprimento
    }
}
`;

fetch('http://localhost:4000/graphql', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ query, variables: { usuarioId: userID } })
})
.then(response => response.json())
.then(async data => {   
if (data.data && data.data.dadosGravidezPorUsuario) {
    data.data.dadosGravidezPorUsuario.sort((a, b) => a.semana - b.semana);

    for (const item of data.data.dadosGravidezPorUsuario) {
        const queryMedia = `
            query ($semana: Int!) {
                gravidezMediaPorSemana(semana: $semana) {
                    peso
                    comprimento
                    facto
                }
            }
        `;
        
        const responseMedia = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryMedia, variables: { semana: item.semana } })
        });
        
        const dataMedia = await responseMedia.json();
        const semanaData = dataMedia.data.gravidezMediaPorSemana;
        
        const row = resultsTableBody.insertRow();
        row.insertCell(0).innerText = item.semana;
        row.insertCell(1).innerText = item.peso;
        row.insertCell(2).innerText = item.comprimento;
        row.insertCell(3).innerText = semanaData ? semanaData.peso : 'N/A';
        row.insertCell(4).innerText = semanaData ? semanaData.comprimento : 'N/A';
        row.insertCell(5).innerText = semanaData ? semanaData.facto : 'N/A';
    }
} else {
    alert("Nenhum dado de gravidez encontrado.");
}
})
.catch(error => {
console.error("Erro ao carregar os resultados:", error);
alert("Ocorreu um erro ao carregar os resultados.");
});
});

checkLoginStatus();

const url = 'ws://localhost:4000/graphql'; 

const client = graphqlWs.createClient({
    url: url,
});
const SUBSCRIPTION_QUERY = `
    subscription Subscription {
        notificacaoNovoRegistro {
            mensagem
            usuarioId
        }
    }
    `;
client.subscribe(
    {
        query: SUBSCRIPTION_QUERY,
    },
    {
        next: (data) => {
            console.log(data)
            const mensagem = data.data.notificacaoNovoRegistro.mensagem
            ;
            document.getElementById('data').innerText = `
    Mensagem nova:
    Conteúdo: ${mensagem}
   
`;
        },
        error: (err) => console.error('Erro na subscrição:', err),
        complete: () => console.log('Subscrição terminada'),
    }
);