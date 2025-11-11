<?php
require_once __DIR__ . '/ModeloBase.php';

class Genero extends ModeloBase {
    protected $tabla = 'Genero';

    # Propiedades
    public $idGen;
    public $nomGen;
    public $desGen;
    public $nomenGen;

    public function __construct($data = []) {
        parent::__construct();

        $this->idGen = $data['idGen'] ?? null;
        $this->nomGen = $data['nomGen'] ?? null;
        $this->desGen = $data['desGen'] ?? null;
        $this->nomenGen = $data['nomenGen'] ?? null;
    }

    # Obtener género por ID 
    public function obtenerPorId($id, $campo_id = 'idGen') {
        $data = parent::obtenerPorId($id, $campo_id);
        return $data ? new Genero($data) : null;
    }
}