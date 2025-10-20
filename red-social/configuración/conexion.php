<?php
class Conexion {
    private $host = "localhost";
    private $usuario = "root";
    private $password = "";
    private $baseDatos = "redsocialquetzales";
    private $conexion;

    public function __construct() {
        try {
            // Crear conexión PDO
            $this->conexion = new PDO(
                "mysql:host={$this->host};dbname={$this->baseDatos};charset=utf8mb4",
                $this->usuario,
                $this->password
            );

            // Configurar opciones PDO
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            die("Error de conexión: " . $e->getMessage());
        }
    }

    public function getConexion() {
        return $this->conexion;
    }
}