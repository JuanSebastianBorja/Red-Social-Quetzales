<?php
require_once __DIR__ . '/ModeloBase.php';
require_once __DIR__ . '/Usuario.php'; 

class Perfil extends ModeloBase {
    protected $tabla = 'Perfil';

    # Propiedades
    public $idPer;
    public $nomPer;
    public $desPer;
    public $habilidades;

    public function __construct($data = []) {
        parent::__construct();
        $this->idPer = $data['idPer'] ?? null;
        $this->nomPer = $data['nomPer'] ?? null;
        $this->desPer = $data['desPer'] ?? null;
        $this->habilidades = $data['habilidades'] ?? null;
    }

    // Obtener los usuarios asociados a este perfil
    public function obtenerUsuarios() {
        if (empty($this->idPer)) return [];

        $sql = "SELECT * FROM Usuario WHERE idPer = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->idPer]);
        $usuarios = [];

        while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $usuarios[] = new Usuario($fila);
        }

        return $usuarios;
    }

    // Obtener perfil por ID 
    public function obtenerPorId($id, $campo_id = 'idPer') {
        $data = parent::obtenerPorId($id, $campo_id);
        return $data ? new Perfil($data) : null;
    }

}