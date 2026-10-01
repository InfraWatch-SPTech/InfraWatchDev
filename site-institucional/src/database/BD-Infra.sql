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
    ip VARCHAR(25),
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
    descricao VARCHAR(200)
);

CREATE TABLE configuracaoAlerta (
    nomeMetrica VARCHAR(50) NOT NULL,
    valorLimite DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(20) NOT NULL DEFAULT "%",
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    fkEquipamento INT NOT NULL,
    fkComponente INT NOT NULL,
    FOREIGN KEY (fkEquipamento) REFERENCES equipamento(idEquipamento),
    FOREIGN KEY (fkComponente) REFERENCES componente(idComponente),
    CONSTRAINT pk_configuracaoAlerta PRIMARY KEY (fkEquipamento, fkComponente)
);

CREATE TABLE relatorio (
    idRelatorio INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(45) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    data_rel DATETIME DEFAULT CURRENT_TIMESTAMP,
    fkEquipamento INT,
    FOREIGN KEY (fkEquipamento) REFERENCES equipamento(idEquipamento)
);


INSERT INTO permissao (idPermissao, nome, descricao) VALUES 
(1, 'Root', 'root'),
(2, 'Admin', 'Administrador'),
(3, 'Analista geral', 'Visualização de tudo'),
(4, 'Notebooks', 'Apenas visualização dos notebooks'),
(5, 'Servidores', 'Apenas visualização dos servidores'),
(6, 'Alertas', 'Visualização de todos os equipamentos em alerta');

INSERT INTO empresa (idEmpresa, nome, cnpj, email, codigo) VALUES 
(1, 'InfraWatch', '12.345.555/0001-90', 'contato@infraWatch.com', 'X678JNLL'),
(2, 'Bananinha Ltda', '12.345.678/0001-90', 'contato@techsolutions.com', 'X678JNSZ'),
(3, 'Xpto Brasil', '98.765.432/0001-10', 'suporte@datacenterbrasil.com', 'K492MLQX'),
(4, 'Batata Tech', '11.222.333/0001-44', 'contato@cloudnova.com', 'V375BWRZ'),
(5, 'Security SA', '55.666.777/0001-88', 'seguranca@infosecurity.com', 'P254KTVW'),
(6, 'Pro', '99.888.777/0001-66', 'network@networkpro.com', 'M931JGBC');

INSERT INTO usuario (nome, email, senha, fkEmpresa, fkPermissao) VALUES 
('root', 'admin@infrawatch.com', 'admin123', 1, 1),
('Admin Bananinha', 'admin@bananinha.com', 'admin123', 2, 2),
('Gerente Bananinha', 'gerente@bananinha.com', 'gerente123', 2, 3),
('Admin Xpto', 'admin@xpto.com', 'admin123', 3, 2),
('Gerente Xpto', 'gerente@xpto.com', 'gerente123', 3, 3),
('Admin Batata', 'admin@batata.com', 'admin123', 4, 2),
('Gerente Batata', 'gerente@batata.com', 'gerente123', 4, 3),
('Admin Security', 'admin@security.com', 'admin123', 5, 2),
('Gerente Security', 'gerente@security.com', 'gerente123', 5, 3),
('Admin Pro', 'admin@pro.com', 'admin123', 6, 2),
('Gerente Pro', 'gerente@pro.com', 'gerente123', 6, 3);

INSERT INTO equipamento (idEquipamento, nome, tipo, ip, status, localizacao, descricao, fkEmpresa) VALUES
(1, 'Servidor Principal', 'Servidor', '192.168.1.10', 'Online', 'TI', 'Servidor principal de TI', 2),
(2, 'Switch Central', 'Switch', '192.168.1.20', 'Online', 'RH', 'Switch central do RH', 2),
(3, 'Roteador Principal', 'Roteador', '192.168.1.1', 'Online', 'RH', 'Roteador principal do RH', 2),
(4, 'Servidor Web', 'Servidor', '192.168.2.10', 'Online', 'TI', 'Servidor web de TI', 3),
(5, 'Servidor Banco de Dados', 'Servidor', '192.168.2.11', 'Online', 'TI', 'Servidor do banco de dados', 3),
(6, 'Firewall', 'Firewall', '192.168.2.254', 'Online', 'Segurança', 'Firewall localizado na área de segurança', 3),
(7, 'Servidor Aplicação', 'Servidor', '192.168.3.10', 'Online', 'TI', 'Servidor de Aplicação de TI', 4),
(8, 'Switch Produção', 'Switch', '192.168.3.20', 'Offline', 'TI', 'Switch de produção de TI', 4),
(9, 'Roteador Principal', 'Roteador', '192.168.3.1', 'Online', 'Segurança', 'Roteador principal de segurança', 4),
(10, 'Servidor Segurança', 'Servidor', '192.168.4.10', 'Online', 'Segurança', 'Servidor de segurança', 5),
(11, 'Firewall Corporativo', 'Firewall', '192.168.4.254', 'Online', 'RH', 'Firewall do RH', 5),
(12, 'Servidor Backup', 'Servidor', '192.168.4.20', 'Online', 'TI', 'Servidor de rollback', 5),
(13, 'Servidor Principal', 'Servidor', '192.168.5.10', 'Online', 'Financeiro', 'Servidor principal do financeiro', 6),
(14, 'Switch Core', 'Switch', '192.168.5.20', 'Online', 'Financeiro', 'Switch core do financeiro', 6),
(15, 'Roteador', 'Roteador', '192.168.5.1', 'Manutenção', 'RH', 'Roteador do RH', 6);

INSERT INTO componente (idComponente, nome, tipo, descricao, fkEquipamento) VALUES
(1, 'Processador', 'CPU', 'Processador do servidor', 1),
(2, 'Memória RAM', 'RAM', 'Memória principal do servidor', 1),
(3, 'Disco', 'Armazenamento', 'Unidade de armazenamento principal', 1),
(4, 'CPU', 'CPU', 'Processador interno do switch', 2),
(5, 'Memória', 'RAM', 'Memória interna do equipamento', 2),
(6, 'CPU', 'CPU', 'Processador do roteador', 3),
(7, 'Memória', 'RAM', 'Memória do roteador', 3),
(8, 'Processador', 'CPU', 'Processador do servidor web', 4),
(9, 'Memória RAM', 'RAM', 'Memória do servidor web', 4),
(10, 'Disco', 'Armazenamento', 'Armazenamento do servidor web', 4),
(11, 'Processador', 'CPU', 'Processador do banco de dados', 5),
(12, 'Memória RAM', 'RAM', 'Memória do banco de dados', 5),
(13, 'Disco', 'Armazenamento', 'Armazenamento do banco de dados', 5),
(14, 'Processador', 'CPU', 'Processador do firewall', 6),
(15, 'Memória', 'RAM', 'Memória do firewall', 6),
(16, 'Processador', 'CPU', 'Processador do servidor', 7),
(17, 'Memória RAM', 'RAM', 'Memória do servidor', 7),
(18, 'Disco', 'Armazenamento', 'Armazenamento do servidor', 7),
(19, 'CPU', 'CPU', 'Processador do switch', 8),
(20, 'Memória', 'RAM', 'Memória do switch', 8),
(21, 'CPU', 'CPU', 'Processador do roteador', 9),
(22, 'Memória', 'RAM', 'Memória do roteador', 9),
(23, 'Processador', 'CPU', 'Processador do servidor de segurança', 10),
(24, 'Memória RAM', 'RAM', 'Memória do servidor', 10),
(25, 'Disco', 'Armazenamento', 'Armazenamento do servidor', 10),
(26, 'Processador', 'CPU', 'Processador do firewall', 11),
(27, 'Memória', 'RAM', 'Memória do firewall', 11),
(28, 'Processador', 'CPU', 'Processador do servidor de backup', 12),
(29, 'Memória RAM', 'RAM', 'Memória do servidor', 12),
(30, 'Disco', 'Armazenamento', 'Unidade de backup', 12),
(31, 'Processador', 'CPU', 'Processador do servidor', 13),
(32, 'Memória RAM', 'RAM', 'Memória principal', 13),
(33, 'Disco', 'Armazenamento', 'Armazenamento principal', 13),
(34, 'CPU', 'CPU', 'Processador do switch', 14),
(35, 'Memória', 'RAM', 'Memória do switch', 14),
(36, 'CPU', 'CPU', 'Processador do roteador', 15),
(37, 'Memória', 'RAM', 'Memória do roteador', 15);

INSERT INTO configuracaoAlerta (fkEquipamento, fkComponente, nomeMetrica, valorLimite, unidade, ativo) VALUES
(1, 1, 'Uso de CPU', 80.00, '%', 1),
(1, 2, 'Uso de Memória', 85.00, '%', 1),
(1, 3, 'Espaço em Disco', 90.00, '%', 1),
(4, 8, 'Uso de CPU', 80.00, '%', 1),
(4, 9, 'Uso de Memória', 75.00, '%', 1),
(5, 11, 'Uso de CPU', 85.00, '%', 1),
(5, 12, 'Uso de Memória', 90.00, '%', 1),
(5, 13, 'Espaço em Disco', 85.00, '%', 1),
(6, 14, 'Uso de CPU', 75.00, '%', 1),
(8, 19, 'Uso de CPU', 90.00, '%', 0);

INSERT INTO relatorio (titulo, descricao, data_rel, fkEquipamento) VALUES
('Incidente Switch Produção', 'Queda de conectividade detectada no Switch de produção de TI. Equipamento em estado Offline.', '2026-09-27 10:15:00', 8),
('Manutenção Roteador RH', 'Roteador colocado em manutenção preventiva programada para atualização de firmware.', '2026-09-28 08:30:00', 15),
('Alerta de Armazenamento - BD', 'Espaço ocupado no disco do banco de dados ultrapassou 80% da capacidade total.', '2026-09-28 14:00:00', 5);