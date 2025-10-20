CREATE DATABASE IF NOT EXISTS redsocialquetzales;
USE redsocialquetzales;


CREATE TABLE Genero (
    idGen INT PRIMARY KEY AUTO_INCREMENT,
    nomGen VARCHAR(40),
    desGen VARCHAR(60),
    nomenGen CHAR(3)
);


CREATE TABLE Perfil (
    idPer INT PRIMARY KEY AUTO_INCREMENT,
    nomPer VARCHAR(40),
    desPer VARCHAR(60),
    habilidades VARCHAR(60)
);


CREATE TABLE Usuario (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nombresUsu VARCHAR(40),
    apellidosUsu VARCHAR(40),
    emailUsu VARCHAR(40) UNIQUE NOT NULL,
    telefonoUsu VARCHAR(10),
    rol ENUM('proveedor', 'consumidor', 'admin') NOT NULL,
    estado ENUM('activo','bloqueado'),
    idGen INT,
    idPer INT,
    FOREIGN KEY (idGen) REFERENCES Genero(idGen),
    FOREIGN KEY (idPer) REFERENCES Perfil(idPer) ON DELETE SET NULL
);


CREATE TABLE Categoria (
    idCategoria INT PRIMARY KEY AUTO_INCREMENT,
    nomCategoria VARCHAR(40),
    desCategoria VARCHAR(60),
    nomenCategoria CHAR(3)
);


CREATE TABLE Servicio (
    idServicio INT PRIMARY KEY AUTO_INCREMENT,
    tituloServicio VARCHAR(40),
    estado ENUM('activo','inactivo','suspendido'),
    descripcionServicio VARCHAR(60),
    precioServicio DECIMAL(15,2),
    imagenServicio VARCHAR(255),
    idCategoria INT,
    idUsuario INT,
    FOREIGN KEY (idCategoria) REFERENCES Categoria(idCategoria),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);


CREATE TABLE Cartera (
    idCartera INT PRIMARY KEY AUTO_INCREMENT,
    saldo DECIMAL(15,2),
    idUsuario INT NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    UNIQUE KEY (idUsuario)
);


CREATE TABLE MovimientoCartera (
    idMovimiento INT PRIMARY KEY AUTO_INCREMENT,
    idCartera INT NOT NULL,
    tipoMovimiento ENUM('ingreso', 'egreso', 'transferencia') NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    fechaMovimiento DATETIME,
    FOREIGN KEY (idCartera) REFERENCES Cartera(idCartera)
);


CREATE TABLE SolicitudServicio (
    idSolicitudServicio INT PRIMARY KEY AUTO_INCREMENT,
    idServicio INT NOT NULL,
    idUsuarioSolici INT NOT NULL,
    idUsuarioProve INT NOT NULL,
    fechaContratacion DATETIME,
    estado ENUM('aceptada', 'pendiente', 'rechazada'),
    FOREIGN KEY (idServicio) REFERENCES Servicio(idServicio),
    FOREIGN KEY (idUsuarioSolici) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idUsuarioProve) REFERENCES Usuario(idUsuario)
);


CREATE TABLE Transaccion (
    idTransaccion INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50),
    monto DECIMAL(15,2),
    fecha DATETIME,
    idCarteraOrigen INT NOT NULL,
    idCarteraDestino INT NOT NULL,
    estado ENUM('pendiente', 'cancelado', 'aceptado'),
    idSolicitudServicio INT,
    FOREIGN KEY (idCarteraOrigen) REFERENCES Cartera(idCartera),
    FOREIGN KEY (idCarteraDestino) REFERENCES Cartera(idCartera),
    FOREIGN KEY (idSolicitudServicio) REFERENCES SolicitudServicio(idSolicitudServicio)
);


CREATE TABLE Escrow (
    idEscrow INT PRIMARY KEY AUTO_INCREMENT,
    montoRetenido DECIMAL(15,2),
    estado ENUM('pendiente','abierto','cerrado'),
    fechaCreacion DATETIME,
    idTransaccion INT,
    idSolicitudServicio INT,
    FOREIGN KEY (idTransaccion) REFERENCES Transaccion(idTransaccion),
    FOREIGN KEY (idSolicitudServicio) REFERENCES SolicitudServicio(idSolicitudServicio)
);


CREATE TABLE Disputa (
    idDisputa INT PRIMARY KEY AUTO_INCREMENT,
    motivo VARCHAR(60),
    descripcion VARCHAR(120),
    estado ENUM('abierta', 'resuelta', 'cerrada'),
    fechaApertura DATETIME,
    fechaCierre DATETIME,
    idEscrow INT,
    idUsuarioCreador INT NOT NULL,
    idUsuarioOpuesto INT NOT NULL,
    idUsuarioMediador INT,
    resolucion VARCHAR(90),
    rolResolutor ENUM('admin', 'mediador', 'usuario'),
    FOREIGN KEY (idEscrow) REFERENCES Escrow(idEscrow),
    FOREIGN KEY (idUsuarioCreador) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idUsuarioOpuesto) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idUsuarioMediador) REFERENCES Usuario(idUsuario)
);


CREATE TABLE Notificacion (
    idNotificacion INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(20),
    tipo ENUM('transaccion', 'mensaje'),
    leido BOOLEAN,
    contenido VARCHAR(90),
    fecha DATETIME,
    idUsuario INT NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

CREATE TABLE Conversacion (
    idConversacion INT PRIMARY KEY AUTO_INCREMENT,
    fechaInicio DATETIME
);


CREATE TABLE UsuarioConversacion (
    idUsuarioConversacion INT PRIMARY KEY AUTO_INCREMENT,
    idUsuario INT NOT NULL,
    idConversacion INT NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idConversacion) REFERENCES Conversacion(idConversacion)
);


CREATE TABLE Mensaje (
    idMensaje INT PRIMARY KEY AUTO_INCREMENT,
    contenido VARCHAR(90),
    fechaHora DATETIME,
    idConversacion INT NOT NULL,
    idUsuarioEmisor INT NOT NULL,
    FOREIGN KEY (idConversacion) REFERENCES Conversacion(idConversacion),
    FOREIGN KEY (idUsuarioEmisor) REFERENCES Usuario(idUsuario)
);


CREATE TABLE Calificacion (
    idCalificacion INT PRIMARY KEY AUTO_INCREMENT,
    puntaje INT,
    comentario VARCHAR(90),
    fecha DATETIME,
    idUsuarioCalificado INT NOT NULL,
    idUsuarioCalificador INT NOT NULL,
    idServicio INT NOT NULL,
    FOREIGN KEY (idUsuarioCalificado) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idUsuarioCalificador) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idServicio) REFERENCES Servicio(idServicio)
);


CREATE TABLE ModeracionServicio (
    idModeracionServicio INT PRIMARY KEY AUTO_INCREMENT,
    idServicio INT NOT NULL,
    descripcion VARCHAR(90),
    tipo ENUM('fraude', 'spam', 'incumplimiento'),
    estado ENUM('pendiente', 'descartada', 'aceptada'),
    idUsuarioAdmin INT NOT NULL,
    fecha DATETIME,
    FOREIGN KEY (idServicio) REFERENCES Servicio(idServicio),
    FOREIGN KEY (idUsuarioAdmin) REFERENCES Usuario(idUsuario)
);


CREATE TABLE ModeracionPerfil (
    idModeracionPerfil INT PRIMARY KEY AUTO_INCREMENT,
    idUsuarioReportado INT NOT NULL,
    descripcion VARCHAR(90),
    tipo ENUM('fraude', 'spam', 'incumplimiento'),
    estado ENUM('pendiente', 'descartada', 'aceptada'),
    idUsuarioAdmin INT NOT NULL,
    fecha DATETIME,
    FOREIGN KEY (idUsuarioReportado) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (idUsuarioAdmin) REFERENCES Usuario(idUsuario)
);


CREATE TABLE Reporte (
    idReporte INT PRIMARY KEY AUTO_INCREMENT,
    tipo ENUM('transaccionesUsuario', 'ingresosGastos', 'historialServicios'),
    contenido TEXT,
    fechaGeneracion DATETIME,
    fechaInicio DATETIME,
    fechaFin DATETIME,
    idUsuario INT NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);


CREATE TABLE Metricas (
    idMetrica INT PRIMARY KEY AUTO_INCREMENT,
    usuariosActivos INT,
    transaccionesCompletadas INT,
    volumenQuetzales DECIMAL(15,2),
    fecha DATETIME
);


CREATE TABLE Autenticacion (
    idAutenticacion INT PRIMARY KEY AUTO_INCREMENT,
    fechaIngreso DATETIME,
    password VARCHAR(12),
    nombreUsuario VARCHAR(20),
    idUsuario INT,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

CREATE TABLE Auditoria (
    idAuditoria INT PRIMARY KEY AUTO_INCREMENT,
    idAutenticacion INT,
    fechaIngreso DATETIME,
    proceso VARCHAR(20),
    descripcion VARCHAR(40),
    horaAuditoria TIME,
    FOREIGN KEY (idAutenticacion) REFERENCES Autenticacion(idAutenticacion)
);