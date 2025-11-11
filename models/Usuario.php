<?php
require_once __DIR__ . '/ModeloBase.php';

class Usuario extends ModeloBase {
    protected $tabla = 'Usuario';

    # Propiedades
    public $idUsuario;
    public $nombresUsu;
    public $apellidosUsu;
    public $emailUsu;
    public $telefonoUsu;
    public $rol;
    public $estado;
    public $idGen;
    public $idPer;

    public function __construct($data = []) {
        parent::__construct();

        $this->idUsuario   = $data['idUsuario'] ?? null;
        $this->nombresUsu  = $data['nombresUsu'] ?? null;
        $this->apellidosUsu = $data['apellidosUsu'] ?? null;
        $this->emailUsu    = $data['emailUsu'] ?? null;
        $this->telefonoUsu = $data['telefonoUsu'] ?? null;
        $this->rol         = $data['rol'] ?? null;
        $this->estado      = $data['estado'] ?? 'activo';
        $this->idGen       = $data['idGen'] ?? null;
        $this->idPer       = $data['idPer'] ?? null;
    }

    # Método específico de verificar si el email ya existe
    public function emailExiste($email) {
        $sql = "SELECT COUNT(*) FROM {$this->tabla} WHERE emailUsu = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    # Obtener el género asociado al usuario
    public function obtenerGenero() {
        if (!$this->idGen) return null;
        $stmt = $this->db->prepare("SELECT * FROM Genero WHERE idGen = ?");
        $stmt->execute([$this->idGen]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    # Obtener el perfil asociado al usuario
    public function obtenerPerfil() {
        if (!$this->idPer) return null;
        $stmt = $this->db->prepare("SELECT * FROM Perfil WHERE idPer = ?");
        $stmt->execute([$this->idPer]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    # Obtener usuario por email
    public function obtenerPorEmail($email) {
        $sql = "SELECT * FROM {$this->tabla} WHERE emailUsu = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? new Usuario($data) : null;
    }

    public function obtenerPorId($id, $campo_id = 'idUsuario') {
        $data = parent::obtenerPorId($id, $campo_id);
        return $data ? new Usuario($data) : null;
    }

}