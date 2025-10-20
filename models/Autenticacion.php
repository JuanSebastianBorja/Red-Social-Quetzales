<?php
require_once __DIR__ . '/ModeloBase.php';
require_once __DIR__ . '/Usuario.php';

class Autenticacion extends ModeloBase {
    protected $tabla = 'Autenticacion';

    # Propiedades
    public $idAutenticacion;
    public $fechaIngreso;
    public $password; 
    public $nombreUsuario;
    public $idUsuario;

    public function __construct($data = []) {
        parent::__construct();
        $this->idAutenticacion = $data['idAutenticacion'] ?? null;
        $this->fechaIngreso = $data['fechaIngreso'] ?? null;
        $this->password = $data['password'] ?? null;
        $this->nombreUsuario = $data['nombreUsuario'] ?? null;
        $this->idUsuario = $data['idUsuario'] ?? null;
    }

    # Método para crear una nueva autenticación (sin hash)
    public function crear($datos) {
        $campos = array_keys($datos);
        $valores = array_values($datos);

        $campos_sql = implode(', ', $campos);
        $placeholders = ':' . implode(', :', $campos);

        $sql = "INSERT INTO {$this->tabla} ({$campos_sql}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute($datos);
    }

    # Verificar credenciales de login (sin hash, el controlador lo hará)
    public function obtenerPorNombreUsuario($nombreUsuario) {
        $sql = "SELECT * FROM {$this->tabla} WHERE nombreUsuario = :nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':nombre', $nombreUsuario);
        $stmt->execute();

        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? new Autenticacion($data) : null;
    }

    # Obtener el usuario asociado
    public function obtenerUsuario() {
        if (empty($this->idUsuario)) return null;
        $stmt = $this->db->prepare("SELECT * FROM Usuario WHERE idUsuario = ?");
        $stmt->execute([$this->idUsuario]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? new Usuario($data) : null;
    }

    # Obtener autenticación por ID de usuario
    public function obtenerPorIdUsuario($idUsuario) {
        $sql = "SELECT * FROM {$this->tabla} WHERE idUsuario = :idUsuario";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':idUsuario', $idUsuario);
        $stmt->execute();
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? new Autenticacion($data) : null;
    }

    # Obtener por ID
    public function obtenerPorId($id, $campo_id = 'idAutenticacion') {
        $data = parent::obtenerPorId($id, $campo_id);
        return $data ? new Autenticacion($data) : null;
    }   
}