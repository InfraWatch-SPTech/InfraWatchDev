DROP DATABASE IF EXISTS InfraWatch;

CREATE DATABASE InfraWatch;
USE InfraWatch;

CREATE TABLE empresa (
    idEmpresa INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(100),
    codigo CHAR(8) NOT NULL
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
    FOREIGN KEY (fkEmpresa) REFERENCES empresa(idEmpresa),
    FOREIGN KEY (fkPermissao) REFERENCES permissao(idPermissao)
);

CREATE TABLE equipamento (
    idEquipamento INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    ip VARCHAR(15),
    status VARCHAR(20),
    localizacao VARCHAR(150),
    descricao VARCHAR(200),
    fkEmpresa INT,
    FOREIGN KEY (fkEmpresa) REFERENCES empresa(idEmpresa)
);


CREATE TABLE componente (
    idComponente INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    descricao VARCHAR(200),
    fkEquipamento INT,
    FOREIGN KEY (fkEquipamento) REFERENCES equipamento(idEquipamento) ON DELETE CASCADE
);


CREATE TABLE metrica (
    idMetrica INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2),
    unidade VARCHAR(20),
    dataHora DATETIME,
    fkComponente INT,
    FOREIGN KEY (fkComponente) REFERENCES componente(idComponente) ON DELETE CASCADE
);

INSERT INTO permissao (idPermissao, nome, descricao) VALUES 
(1, 'Super Usuario','root'),
(2, 'Admin', 'Administrador'),
(3, 'Gerente', 'Gerente'),
(4, 'Usuario','Usuario Comum');

INSERT INTO empresa (idEmpresa, nome, cnpj, email, codigo) VALUES 
(2, 'Bananinha Ltda', '12.345.678/0001-90', 'contato@techsolutions.com', 'X678JNSZ'),
(3, 'Xpto Brasil', '98.765.432/0001-10', 'suporte@datacenterbrasil.com', 'K492MLQX'),
(4, 'Batata Tech', '11.222.333/0001-44', 'contato@cloudnova.com', 'V375BWRZ'),
(5, 'Security SA', '55.666.777/0001-88', 'seguranca@infosecurity.com', 'P254KTVW'),
(6, 'Pro', '99.888.777/0001-66', 'network@networkpro.com', 'M931JGBC');

INSERT INTO usuario (nome, email, senha, fkEmpresa, fkPermissao) VALUES 
-- InfraWatch
('root', 'admin@infrawatch.com', 'admin123', NULL, 1),
-- Bananinha Ltda
('Admin Bananinha', 'admin@bananinha.com', 'admin123', 2, 2),
('Gerente Bananinha', 'gerente@bananinha.com', 'gerente123', 2, 3),
-- Xpto Brasil
('Admin Xpto', 'admin@xpto.com', 'admin123', 3, 2),
('Gerente Xpto', 'gerente@xpto.com', 'gerente123', 3, 3),
-- Batata Tech
('Admin Batata', 'admin@batata.com', 'admin123', 4, 2),
('Gerente Batata', 'gerente@batata.com', 'gerente123', 4, 3),
-- Security SA
('Admin Security', 'admin@security.com', 'admin123', 5, 2),
('Gerente Security', 'gerente@security.com', 'gerente123', 5, 3),
-- Pro
('Admin Pro', 'admin@pro.com', 'admin123', 6, 2),
('Gerente Pro', 'gerente@pro.com', 'gerente123', 6, 3);

INSERT INTO equipamento
(nome, tipo, ip, status,localizacao, descricao, fkEmpresa)
VALUES
('Servidor Principal', 'Servidor', '192.168.1.10', 'Online','TI','Servidor principal de TI', 2),
('Switch Central', 'Switch', '192.168.1.20', 'Online','RH','Switch central do RH', 2),
('Roteador Principal', 'Roteador', '192.168.1.1', 'Online','RH','Roteador principal do RH', 2),
('Servidor Web', 'Servidor', '192.168.2.10', 'Online', 'TI','Servidor web de TI', 3),
('Servidor Banco de Dados', 'Servidor', '192.168.2.11', 'Online','TI','Servidor do banco de dados', 3),
('Firewall', 'Firewall', '192.168.2.254', 'Online', 'Segurança','Firewall localizado na área de segurança', 3),
('Servidor Aplicação', 'Servidor', '192.168.3.10', 'Online','TI','Servidor de Aplicação de TI', 4),
('Switch Produção', 'Switch', '192.168.3.20', 'Offline', 'TI', 'Switch de produção de TI',4),
('Roteador Principal', 'Roteador', '192.168.3.1', 'Online','Segurança','Roteador principal de segurança', 4),
('Servidor Segurança', 'Servidor', '192.168.4.10', 'Online','Segurança','Servidor de segurança', 5),
('Firewall Corporativo', 'Firewall', '192.168.4.254', 'Online','RH','Firewall do RH', 5),
('Servidor Backup', 'Servidor', '192.168.4.20', 'Online','TI','Servidor de roolback', 5),
('Servidor Principal', 'Servidor', '192.168.5.10', 'Online','Financeiro', 'Servidor principal do financeiro',6),
('Switch Core', 'Switch', '192.168.5.20', 'Online','Financeiro', 'Switch core do financeiro', 6),
('Roteador', 'Roteador', '192.168.5.1', 'Manutenção','RH', 'Roteador do RH',6);

INSERT INTO componente
(nome, tipo, descricao, fkEquipamento)
VALUES
('Processador', 'CPU', 'Processador do servidor', 1),
('Memória RAM', 'RAM', 'Memória principal do servidor', 1),
('Disco', 'Armazenamento', 'Unidade de armazenamento principal', 1),
('CPU', 'CPU', 'Processador interno do switch', 2),
('Memória', 'RAM', 'Memória interna do equipamento', 2),
('CPU', 'CPU', 'Processador do roteador', 3),
('Memória', 'RAM', 'Memória do roteador', 3),
('Processador', 'CPU', 'Processador do servidor web', 4),
('Memória RAM', 'RAM', 'Memória do servidor web', 4),
('Disco', 'Armazenamento', 'Armazenamento do servidor web', 4),
('Processador', 'CPU', 'Processador do banco de dados', 5),
('Memória RAM', 'RAM', 'Memória do banco de dados', 5),
('Disco', 'Armazenamento', 'Armazenamento do banco de dados', 5),
('Processador', 'CPU', 'Processador do firewall', 6),
('Memória', 'RAM', 'Memória do firewall', 6),
('Processador', 'CPU', 'Processador do servidor', 7),
('Memória RAM', 'RAM', 'Memória do servidor', 7),
('Disco', 'Armazenamento', 'Armazenamento do servidor', 7),
('CPU', 'CPU', 'Processador do switch', 8),
('Memória', 'RAM', 'Memória do switch', 8),
('CPU', 'CPU', 'Processador do roteador', 9),
('Memória', 'RAM', 'Memória do roteador', 9),
('Processador', 'CPU', 'Processador do servidor de segurança', 10),
('Memória RAM', 'RAM', 'Memória do servidor', 10),
('Disco', 'Armazenamento', 'Armazenamento do servidor', 10),
('Processador', 'CPU', 'Processador do firewall', 11),
('Memória', 'RAM', 'Memória do firewall', 11),
('Processador', 'CPU', 'Processador do servidor de backup', 12),
('Memória RAM', 'RAM', 'Memória do servidor', 12),
('Disco', 'Armazenamento', 'Unidade de backup', 12),
('Processador', 'CPU', 'Processador do servidor', 13),
('Memória RAM', 'RAM', 'Memória principal', 13),
('Disco', 'Armazenamento', 'Armazenamento principal', 13),
('CPU', 'CPU', 'Processador do switch', 14),
('Memória', 'RAM', 'Memória do switch', 14),
('CPU', 'CPU', 'Processador do roteador', 15),
('Memória', 'RAM', 'Memória do roteador', 15);