CREATE DATABASE Asta_Black_Clover;
USE Asta_Black_Clover;
-- A criação de tabelas está organizada conforme da regra do négocio.

-- nomenclatura das Constraints
-- exp: c_Check_Quiz_qtd_descrisao
-- c - constraint, 
-- Check - tipo da constraint | inicia com letra maiuscula sempre,
-- Quiz -  tabela que a constraint esta sendo criada | inicia com letra maiuscula sempre,
-- qtd_descrisao - campo da tabela | tudo minuscula


/*
	Usuario e perm Schema
*/

CREATE TABLE permissao (
	id_permissao INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(45)
);

INSERT INTO permissao (tipo) VALUES
	('admin'),
    ('user');

CREATE TABLE usuario(
	id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50),
    cpf CHAR(11) NOT NULL UNIQUE,
    email VARCHAR(100),
    senha VARCHAR(50) NOT NULL,
    dt_cadastro DATETIME DEFAULT NOW(),
    fk_permissao INT DEFAULT 2,
    CONSTRAINT cFk_Usuario_fk_permissao FOREIGN KEY (fk_permissao) REFERENCES permissao(id_permissao)
);

INSERT INTO usuario (nome, cpf, email, senha, fk_permissao) VALUES
    ('Administrador', '12345678910', 'caio_admin@email.com', '191012', 1);

/*
Quiz Schema
*/

CREATE TABLE quiz(
	id_quiz INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50),
    descricao VARCHAR(250),
    qtd_questoes INT,
    dt_atualizacao DATETIME,
    CONSTRAINT c_Check_Quiz_qtd_questoes CHECK (qtd_questoes BETWEEN 0 AND 10)
);

CREATE TABLE resultado(
    id_resultado INT PRIMARY KEY AUTO_INCREMENT,
    pontuacao INT,
	dt_realizacao DATETIME DEFAULT NOW(),
    fk_usuario INT,
    fk_quiz INT,
    CONSTRAINT cFk_Resultado_fk_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT cFk_Resultado_fk_quiz FOREIGN KEY (fk_quiz) REFERENCES quiz(id_quiz)
);

CREATE TABLE questao(
	id_questao INT PRIMARY KEY AUTO_INCREMENT,
    questao VARCHAR(250),
    nivel_questao VARCHAR(50),
    fk_quiz INT,
    CONSTRAINT cCheck_Questao_nivel_questao CHECK (nivel_questao IN('Fácil', 'Médio', 'Difícil')),
    CONSTRAINT cFk_Questao_fk_quiz FOREIGN KEY (fk_quiz) REFERENCES quiz(id_quiz)
);

CREATE TABLE alternativa(
	id_alternativa INT PRIMARY KEY AUTO_INCREMENT,
    texto_alternativa VARCHAR(100),
    tipo TINYINT,
    fk_questao INT,
    CONSTRAINT cCheck_Alternativa_tipo CHECK (tipo IN('0', '1')),
    CONSTRAINT cFk_Alternativa_fk_questao FOREIGN KEY (fk_questao) REFERENCES questao(id_questao)
);

CREATE TABLE resposta_usuario(
	id_resposta INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT, 
    fk_alternativa INT,
    CONSTRAINT cFk_RespostaUsuario_fk_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT cFk_RespostaUsuario_fk_alternativa FOREIGN KEY (fk_alternativa) REFERENCES alternativa(id_alternativa)
);

INSERT INTO quiz(nome, descricao, qtd_questoes, dt_atualizacao) VALUES
    ('GERAL', 'Quiz que abrange muitos temas do anime, como personagens, poderes, batalhas, relacionamentos, esquadrões e etc.', 5, NOW()),
    ('PODERES', 'Quiz que foca nos poderes apresentados no anime, suas caracteristicas e em quais batalhas foram usados.', 5, NOW()),
    ('PERSONAGENS', 'Quiz que foca nos personagens e suas interações no desenvolvimento da história.', 5, NOW());

INSERT INTO questao (questao, nivel_questao, fk_quiz) VALUES
    ('Quem é o protagonista que nasceu sem magia no reino de Clover, mas sonha em se tornar o Rei Mago?', 'Fácil', 1),
    ('Qual é o grande objetivo compartilhado por Asta e Yuno desde a infância, motivando a rivalidade entre os dois?', 'Fácil', 1),
    ('Qual é o nome do esquadrão dos Cavaleiros Mágicos ao qual Asta se junta?', 'Médio', 1),
    ('Qual personagem possui a magia do tempo e ocupa o cargo de Rei Mago no início da obra?', 'Médio', 1),
    ('Qual é o nome do demônio que habita o grimório de cinco folhas de Asta?', 'Difícil', 1),
    ('Qual tipo de magia permite controlar e criar água durante as batalhas?', 'Fácil', 2),
    ('Qual poder é capaz de anular ou cortar efeitos mágicos usando espadas especiais?', 'Fácil', 2),
    ('Qual tipo de magia é utilizada para manipular fios extremamente resistentes e precisos?', 'Médio', 2),
    ('Qual atributo mágico permite acelerar movimentos e ataques através do controle do espaço?', 'Médio', 2),
    ('Qual é o nome da energia utilizada pelos demônios para fortalecer feitiços e habilidades em Black Clover?', 'Difícil', 2),
    ('Qual personagem utiliza magia de corrente e costuma prender seus inimigos em batalha?', 'Fácil', 3),
    ('Qual integrante dos Touros Negros possui uma personalidade extremamente elétrica e usa magia de relâmpago?', 'Fácil', 3),
    ('Qual personagem do Reino Diamond teve seu corpo modificado artificialmente para aumentar seu poder mágico?', 'Médio', 3),
    ('Qual membro dos Touros Negros utiliza magia de transformação para assumir diferentes aparências?', 'Médio', 3),
    ('Qual líder do Olho do Sol da Meia-Noite compartilha o corpo com um elfo chamado Patolli?', 'Difícil', 3);

INSERT INTO alternativa (texto_alternativa, tipo, fk_questao) VALUES
    ('Yami', 0, 1),
    ('Asta', 1, 1),
    ('Luck', 0, 1),
    ('Finral', 0, 1),
    ('Derrotar os demônios', 0, 2),
    ('Superar  o cavalerio mágico mais forte', 0, 2),
    ('Controlar todos os grimórios', 0, 2),
    ('Se tornar o Rei Mago', 1, 2),
    ('Touros Negros', 1, 3),
    ('Leões Carmesins', 0, 3),
    ('Orcas Púrpuras', 0, 3),
    ('Alvorecer Dourado', 0, 3),
    ('Julius Novachrono', 1, 4),
    ('William Vangeance', 0, 4),
    ('Fuegoleon', 0, 4),
    ('Nozel Silva', 0, 4),
    ('Lucifero', 0, 5),
    ('Megicula', 0, 5),
    ('Zagred', 0, 5),
    ('Liebe', 1, 5),
    ('Magia de Gelo', 0, 6),
    ('Magia de Água', 1, 6),
    ('Magia de Névoa', 0, 6),
    ('Magia de Vapor', 0, 6),
    ('Magia de Ferro', 0, 7),
    ('Magia Espacial', 0, 7),
    ('Anti-magia', 1, 7),
    ('Magia de Luz', 0, 7),
    ('Magia de Fios', 1, 8),
    ('Magia de Aço', 0, 8),
    ('Magia de Papel', 0, 8),
    ('Magia de Planta', 0, 8),
    ('Magia do Tempo', 0, 9),
    ('Magia de Vento', 0, 9),
    ('Magia de Gravidade', 0, 9),
    ('Magia Espacial', 1, 9),
    ('Mana Negra', 0, 10),
    ('Poder Demoníaco', 1, 10),
    ('Aura Sombria', 0, 10),
    ('Energia Maldita', 0, 10),
    ('Revchi Salik', 1, 11),
    ('Sekke Bronzazza', 0, 11),
    ('Magna Swing', 0, 11),
    ('Gordon Agrippa', 0, 11),
    ('Luck Voltia', 1, 12),
    ('Finral Roulacase', 0, 12),
    ('Zora Ideale', 0, 12),
    ('Grey', 0, 12),
    ('Langris', 0, 13),
    ('Mars', 1, 13),
    ('Kaiser', 0, 13),
    ('Patolli', 0, 13),
    ('Charmy', 0, 14),
    ('Vanessa', 0, 14),
    ('Secre', 0, 14),
    ('Grey', 1, 14),
    ('Rhya', 0, 15),
    ('Licht', 1, 15),
    ('Vetto', 0, 15),
    ('Fana', 0, 15);

INSERT INTO usuario (nome, cpf, email, senha, dt_cadastro) VALUES
('Luiz Carlos', '11111111133', 'luiz.c@sptech.school', '123456', '2026-05-15 08:15:00'),
('Guilherme Barbosa', '11111111122', 'gui.barb@sptech.school', '123456', '2026-05-15 09:30:00'),
('Felipe', '33333333333', 'felipe@sptech.school', '123456', '2026-05-15 11:45:00'),
('Emanuelly Cristrini', '11111111144', 'ema.c@sptech.school', '123456', '2026-05-16 10:10:00'),
('Isaac Pinheiro', '11111111155', 'isaac.pinheiro@sptech.school', '123456', '2026-05-16 12:20:00'),
('Victor de Sousa', '11111111166', 'victor.sousa@sptech.school', '123456', '2026-05-17 08:40:00'),
('Vitor da Luz', '11111111177', 'vitor.luz@sptech.school', '123456', '2026-05-17 10:15:00'),
('Karina Cupola', '11111111188', 'karina.cupola@sptech.school', '123456', '2026-05-18 14:30:00'),
('Gustavo', '11111111199', 'gustavo@sptech.school', '123456', '2026-05-18 16:45:00'),
('Rafael Costa', '99999999999', 'rafael.c@sptech.school', '123456', '2026-05-17 09:20:00'),
('Patricia Gomes', '10101010101', 'patricia.c@sptech.school', '123456', '2026-05-17 12:35:00'),
('Bruno Ribeiro', '12121212121', 'bruno.r@sptech.school', '123456', '2026-05-17 16:45:00'),
('Camila Ferreira', '13131313131', 'camila.f@sptech.school', '123456', '2026-05-18 08:05:00'),
('Thiago Martins', '14141414141', 'thiago.m@sptech.school', '123456', '2026-05-18 11:15:00'),
('Aline Barbosa', '15151515151', 'aline.b@sptech.school', '123456', '2026-05-18 14:50:00'),
('Gabriel Pereira', '16161616161', 'gabriel.p@sptech.school', '123456', '2026-05-18 19:30:00');

INSERT INTO resultado (pontuacao, dt_realizacao, fk_usuario, fk_quiz) VALUES
	(5, '2026-05-15 08:10:00',1, 1),
	(3, '2026-05-15 09:15:00', 2, 2),
	(4, '2026-05-15 10:20:00', 3, 3),
	(2, '2026-05-15 11:25:00', 4, 1),
	(1, '2026-05-16 12:30:00', 5, 2),
	(5, '2026-05-16 13:35:00', 6, 3),
	(4, '2026-05-16 14:40:00', 7, 1),
	(3, '2026-05-16 15:45:00', 8, 2),
	(2, '2026-05-17 16:50:00', 9, 3),
	(0, '2026-05-17 17:55:00', 10, 1),
	(1, '2026-05-17 18:00:00', 11, 2),
	(2, '2026-05-17 19:05:00', 12, 3),
	(3, '2026-05-12 20:10:00', 13, 1),
	(4, '2026-05-12 08:15:00', 14, 2),
	(5, '2026-05-12 09:20:00', 15, 3),
	(0, '2026-05-12 10:25:00', 16, 1),
	(1, '2026-05-12 11:30:00', 17, 2),
	(2, '2026-05-12 12:35:00', 17, 3),
	(3, '2026-05-12 13:40:00', 1, 1),
	(4, '2026-05-13 14:45:00', 2, 2),
	(5, '2026-05-13 15:50:00', 3, 3),
	(2, '2026-05-13 16:55:00', 4, 1),
	(1, '2026-05-13 17:00:00', 5, 2),
	(0, '2026-05-13 18:05:00', 6, 3),
	(5, '2026-06-01 08:10:00', 7, 1),
	(4, '2026-06-01 09:15:00', 8, 2),
	(3, '2026-06-01 10:20:00', 9, 3),
	(2, '2026-06-01 11:25:00', 10, 1),
	(1, '2026-06-01 12:30:00', 11, 2),
	(0, '2026-06-01 13:35:00', 12, 3);

/*dump exemplo
    -- permissão
INSERT INTO `permissao` VALUES (1,'admin'),(2,'user');
	-- usuários
INSERT INTO `usuario` VALUES (2,'Luiz Carlos','11111111133','luiz.c@sptech.school','123456','2026-05-15 08:15:00',2),(3,'Guilherme Barbosa','11111111122','gui.barb@sptech.school','123456','2026-05-15 09:30:00',2),(4,'Felipe','33333333333','felipe@sptech.school','123456','2026-05-15 11:45:00',2),(5,'Emanuelly Cristrini','11111111144','ema.c@sptech.school','123456','2026-05-16 10:10:00',2),(6,'Isaac Pinheiro','11111111155','isaac.pinheiro@sptech.school','123456','2026-05-16 12:20:00',2),(7,'Victor de Sousa','11111111166','victor.sousa@sptech.school','123456','2026-05-17 08:40:00',2),(8,'Vitor da Luz','11111111177','vitor.luz@sptech.school','123456','2026-05-17 10:15:00',2),(9,'Karina Cupola','11111111188','karina.cupola@sptech.school','123456','2026-05-18 14:30:00',2),(10,'Gustavo','11111111199','gustavo@sptech.school','123456','2026-05-18 16:45:00',2),(11,'Rafael Costa','99999999999','rafael.c@sptech.school','123456','2026-05-17 09:20:00',2),(12,'Patricia Gomes','10101010101','patricia.c@sptech.school','123456','2026-05-17 12:35:00',2),(13,'Bruno Ribeiro','12121212121','bruno.r@sptech.school','123456','2026-05-17 16:45:00',2),(14,'Camila Ferreira','13131313131','camila.f@sptech.school','123456','2026-05-18 08:05:00',2),(15,'Thiago Martins','14141414141','thiago.m@sptech.school','123456','2026-05-18 11:15:00',2),(16,'Aline Barbosa','15151515151','aline.b@sptech.school','123456','2026-05-18 14:50:00',2),(17,'Gabriel Pereira','16161616161','gabriel.p@sptech.school','123456','2026-05-18 19:30:00',2),(18,'Gabriel Pereira2','16161616163','gabriel.2@sptech.school','123456','2026-06-18 19:30:00',2),(19,'aaaaaaaaaaaaaa','11111111113','caiopicciarellisilva@gmail.com','191012','2026-05-23 16:40:39',2),(20,'Caiopicca','11111111112','caio4@admin.com','191012','2026-05-23 16:54:13',2),(21,'Caiopicc4','11111111111','caio4@gmail.com','191012','2026-05-24 10:34:31',2),(22,'Caiopicc3','11111111119','caio9@gmail.com','191012','2026-05-24 11:27:09',2),(23,'Caio Admin','11111111118','caio8@gmail.com','191012','2026-05-24 11:34:50',2),(24,'Caiopicca','11111111117','caio7@gmail.com','191012','2026-05-24 11:52:44',2),(25,'Caiopicc','11111111116','caio6@gmail.com','191012','2026-05-24 12:22:39',2);
	-- quiz
INSERT INTO `quiz` VALUES (1,'GERAL','Quiz que abrange muitos temas do anime, como personagens, poderes, batalhas, relacionamentos, esquadrões e etc.',5,'2026-05-19 21:06:40'),(2,'PODERES','Quiz que foca nos poderes apresentados no anime, suas caracteristicas e em quais batalhas foram usados.',5,'2026-05-19 21:06:40'),(3,'PERSONAGENS','Quiz que foca nos personagens e suas interações no desenvolvimento da história.',5,'2026-05-19 21:06:40');
	-- questoes
INSERT INTO `questao` VALUES (1,'Quem é o protagonista que nasceu sem magia no reino de Clover, mas sonha em se tornar o Rei Mago?','Fácil',1),(2,'Qual é o grande objetivo compartilhado por Asta e Yuno desde a infância, motivando a rivalidade entre os dois?','Fácil',1),(3,'Qual é o nome do esquadrão dos Cavaleiros Mágicos ao qual Asta se junta?','Médio',1),(4,'Qual personagem possui a magia do tempo e ocupa o cargo de Rei Mago no início da obra?','Médio',1),(5,'Qual é o nome do demônio que habita o grimório de cinco folhas de Asta?','Difícil',1),(6,'Qual tipo de magia permite controlar e criar água durante as batalhas?','Fácil',2),(7,'Qual poder é capaz de anular ou cortar efeitos mágicos usando espadas especiais?','Fácil',2),(8,'Qual tipo de magia é utilizada para manipular fios extremamente resistentes e precisos?','Médio',2),(9,'Qual atributo mágico permite acelerar movimentos e ataques através do controle do espaço?','Médio',2),(10,'Qual é o nome da energia utilizada pelos demônios para fortalecer feitiços e habilidades em Black Clover?','Difícil',2),(11,'Qual personagem utiliza magia de corrente e costuma prender seus inimigos em batalha?','Fácil',3),(12,'Qual integrante dos Touros Negros possui uma personalidade extremamente elétrica e usa magia de relâmpago?','Fácil',3),(13,'Qual personagem do Reino Diamond teve seu corpo modificado artificialmente para aumentar seu poder mágico?','Médio',3),(14,'Qual membro dos Touros Negros utiliza magia de transformação para assumir diferentes aparências?','Médio',3),(15,'Qual líder do Olho do Sol da Meia-Noite compartilha o corpo com um elfo chamado Patolli?','Difícil',3);
	-- alternativas
INSERT INTO `alternativa` VALUES (1,'Yami',0,1),(2,'Asta',1,1),(3,'Luck',0,1),(4,'Finral',0,1),(5,'Derrotar os demônios',0,2),(6,'Superar  o cavalerio mágico mais forte',0,2),(7,'Controlar todos os grimórios',0,2),(8,'Se tornar o Rei Mago',1,2),(9,'Touros Negros',1,3),(10,'Leões Carmesins',0,3),(11,'Orcas Púrpuras',0,3),(12,'Alvorecer Dourado',0,3),(13,'Julius Novachrono',1,4),(14,'William Vangeance',0,4),(15,'Fuegoleon',0,4),(16,'Nozel Silva',0,4),(17,'Lucifero',0,5),(18,'Megicula',0,5),(19,'Zagred',0,5),(20,'Liebe',1,5),(21,'Magia de Gelo',0,6),(22,'Magia de Água',1,6),(23,'Magia de Névoa',0,6),(24,'Magia de Vapor',0,6),(25,'Magia de Ferro',0,7),(26,'Magia Espacial',0,7),(27,'Anti-magia',1,7),(28,'Magia de Luz',0,7),(29,'Magia de Fios',1,8),(30,'Magia de Aço',0,8),(31,'Magia de Papel',0,8),(32,'Magia de Planta',0,8),(33,'Magia do Tempo',0,9),(34,'Magia de Vento',0,9),(35,'Magia de Gravidade',0,9),(36,'Magia Espacial',1,9),(37,'Mana Negra',0,10),(38,'Poder Demoníaco',1,10),(39,'Aura Sombria',0,10),(40,'Energia Maldita',0,10),(41,'Revchi Salik',1,11),(42,'Sekke Bronzazza',0,11),(43,'Magna Swing',0,11),(44,'Gordon Agrippa',0,11),(45,'Luck Voltia',1,12),(46,'Finral Roulacase',0,12),(47,'Zora Ideale',0,12),(48,'Grey',0,12),(49,'Langris',0,13),(50,'Mars',1,13),(51,'Kaiser',0,13),(52,'Patolli',0,13),(53,'Charmy',0,14),(54,'Vanessa',0,14),(55,'Secre',0,14),(56,'Grey',1,14),(57,'Rhya',0,15),(58,'Licht',1,15),(59,'Vetto',0,15),(60,'Fana',0,15);
	-- resposta_usuario
INSERT INTO `resposta_usuario` VALUES (1,1,21),(2,1,27),(3,1,29),(4,1,36),(5,1,38),(6,1,3),(7,1,5),(8,1,11),(9,1,14),(10,1,20),(11,1,2),(12,1,8),(13,1,9),(14,1,13),(15,1,20),(16,1,22),(17,1,27),(18,1,29),(19,1,36),(20,1,38),(21,1,42),(22,1,45),(23,1,50),(24,1,56),(25,1,58),(26,1,2),(27,1,8),(28,1,9),(29,1,13),(30,1,20),(31,1,1),(32,1,6),(33,1,10),(34,1,14),(35,1,19),(36,1,21),(37,1,28),(38,1,30),(39,1,34),(40,1,39),(41,1,3),(42,1,5),(43,1,10),(44,1,15),(45,1,18),(46,2,2),(47,2,5),(48,2,10),(49,2,15),(50,2,18),(51,2,42),(52,2,47),(53,2,50),(54,2,56),(55,2,57),(56,2,22),(57,2,27),(58,2,29),(59,2,36),(60,2,38),(61,2,2),(62,2,8),(63,2,9),(64,2,13),(65,2,20),(66,2,41),(67,2,45),(68,2,50),(69,2,56),(70,2,58),(71,2,2),(72,2,8),(73,2,9),(74,2,13),(75,2,20),(76,3,2),(77,3,8),(78,3,9),(79,3,13),(80,3,20),(81,3,21),(82,3,25),(83,3,30),(84,3,33),(85,3,40),(86,3,2),(87,3,8),(88,3,9),(89,3,13),(90,3,20),(91,19,22),(92,19,27),(93,19,29),(94,19,36),(95,19,38),(96,19,42),(97,19,47),(98,19,51),(99,19,54),(100,19,57),(101,19,2),(102,19,7),(103,19,9),(104,19,16),(105,19,17),(106,20,2),(107,20,6),(108,20,12),(109,20,14),(110,20,17),(111,21,21),(112,21,27),(113,21,30),(114,21,36),(115,21,38),(116,22,2),(117,22,8),(118,22,9),(119,22,13),(120,22,20),(121,23,41),(122,23,45),(123,23,50),(124,23,56),(125,23,58),(126,24,2),(127,24,8),(128,24,9),(129,24,13),(130,24,20),(131,25,2),(132,25,8),(133,25,9),(134,25,13),(135,25,20),(136,25,42),(137,25,47),(138,25,50),(139,25,54),(140,25,60);
	-- resultado
INSERT INTO `resultado` VALUES (1,5,'2026-05-15 08:10:00',1,1),(2,3,'2026-05-15 09:15:00',2,2),(3,4,'2026-05-15 10:20:00',3,3),(4,2,'2026-05-15 11:25:00',4,1),(5,1,'2026-05-16 12:30:00',5,2),(6,5,'2026-05-16 13:35:00',6,3),(7,4,'2026-05-16 14:40:00',7,1),(8,3,'2026-05-16 15:45:00',8,2),(9,2,'2026-05-17 16:50:00',9,3),(10,0,'2026-05-17 17:55:00',10,1),(11,1,'2026-05-17 18:00:00',11,2),(12,2,'2026-05-17 19:05:00',12,3),(13,3,'2026-05-12 20:10:00',13,1),(14,4,'2026-05-12 08:15:00',14,2),(15,5,'2026-05-12 09:20:00',15,3),(16,0,'2026-05-12 10:25:00',16,1),(17,1,'2026-05-12 11:30:00',17,2),(18,2,'2026-05-12 12:35:00',18,3),(19,3,'2026-05-12 13:40:00',1,1),(20,4,'2026-05-13 14:45:00',2,2),(21,5,'2026-05-13 15:50:00',3,3),(22,2,'2026-05-13 16:55:00',4,1),(23,1,'2026-05-13 17:00:00',5,2),(24,0,'2026-05-13 18:05:00',6,3),(25,5,'2026-06-01 08:10:00',7,1),(26,4,'2026-06-01 09:15:00',8,2),(27,3,'2026-06-01 10:20:00',9,3),(28,2,'2026-06-01 11:25:00',10,1),(29,1,'2026-06-01 12:30:00',11,2),(30,0,'2026-06-01 13:35:00',12,3),(31,1,'2026-05-21 19:54:25',1,1),(32,5,'2026-05-23 15:18:54',1,1),(33,5,'2026-05-23 15:19:14',1,2),(34,4,'2026-05-23 15:20:37',1,3),(35,5,'2026-05-23 15:22:57',1,1),(36,0,'2026-05-23 15:24:32',1,1),(37,0,'2026-05-23 15:26:33',1,2),(38,0,'2026-05-23 15:35:43',1,1),(39,1,'2026-05-23 15:43:49',2,1),(40,2,'2026-05-23 15:44:20',2,3),(41,5,'2026-05-23 15:53:12',2,2),(42,5,'2026-05-23 15:58:12',2,1),(43,5,'2026-05-23 16:13:53',2,3),(44,5,'2026-05-23 16:18:05',2,1),(45,5,'2026-05-23 16:21:59',3,1),(46,0,'2026-05-23 16:23:38',3,2),(47,5,'2026-05-23 16:29:25',3,1),(48,5,'2026-05-23 16:47:14',19,2),(49,0,'2026-05-23 16:48:20',19,3),(50,2,'2026-05-23 16:49:06',19,1),(51,1,'2026-05-23 16:54:51',20,1),(52,3,'2026-05-24 11:07:36',21,2),(53,5,'2026-05-24 11:30:12',22,1),(54,5,'2026-05-24 11:40:13',23,3),(55,5,'2026-05-24 11:53:16',24,1),(56,5,'2026-05-24 12:23:08',25,1),(57,1,'2026-05-24 12:44:54',25,3);
*/

-- Se for fazer, não insere duas vezes permissão, quiz, questoes e alternativas.


    