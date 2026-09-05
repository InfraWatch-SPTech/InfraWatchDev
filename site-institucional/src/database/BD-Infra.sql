CREATE DATABASE InfraWatch;
USE InfraWatch;

CREATE TABLE empresa (
    idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(100)
);


CREATE TABLE permissao (
    idPermissao INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(200)
);

CREATE TABLE usuario (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(100) NOT NULL,

    fkEmpresa INT,
    fkPermissao INT,

    FOREIGN KEY (fkEmpresa)
        REFERENCES empresa(idEmpresa),

    FOREIGN KEY (fkPermissao)
        REFERENCES permissao(idPermissao)
);



CREATE TABLE equipamento (
    idEquipamento INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    ip VARCHAR(15),
    status VARCHAR(20),

    fkEmpresa INT,

    FOREIGN KEY (fkEmpresa)
        REFERENCES empresa(idEmpresa)
);


CREATE TABLE componente (
    idComponente INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    descricao VARCHAR(200),

    fkEquipamento INT,

    FOREIGN KEY (fkEquipamento)
        REFERENCES equipamento(idEquipamento)
);


CREATE TABLE metrica (
    idMetrica INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2),
    unidade VARCHAR(20),
    dataHora DATETIME,

    fkComponente INT,

    FOREIGN KEY (fkComponente)
        REFERENCES componente(idComponente)
);

INSERT INTO permissao (idPermissao, nome, descricao) VALUES 
(1, 'Admin','root'),
(2, 'Usuario', 'Acesso comum');


INSERT INTO usuario (nome, email, senha, fkEmpresa, fkPermissao) VALUES 
('Administrador', 'admin@infrawatch.com', 'admin123', NULL, 1);

INSERT INTO empresa (idEmpresa, nome, cnpj, email) VALUES 
(2, 'Bananinha Ltda', '12.345.678/0001-90', 'contato@techsolutions.com'),
(3, 'Xpto Brasil', '98.765.432/0001-10', 'suporte@datacenterbrasil.com'),
(4, 'Batata Tech', '11.222.333/0001-44', 'contato@cloudnova.com'),
(5, 'Security SA', '55.666.777/0001-88', 'seguranca@infosecurity.com'),
(6, 'Pro', '99.888.777/0001-66', 'network@networkpro.com');