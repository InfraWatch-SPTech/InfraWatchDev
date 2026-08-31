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