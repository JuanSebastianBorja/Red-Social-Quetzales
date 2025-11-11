<?php
require_once __DIR__ . '/ModeloBase.php';

class Categoria extends ModeloBase {
    protected $tabla = 'Categoria';

    # Propiedades
    public $idCategoria;
    public $nomCategoria;
    public $desCategoria;
    public $nomenCategoria;

    public function __construct($data = []) {
        parent::__construct();

        $this->idCategoria = $data['idCategoria'] ?? null;
        $this->nomCategoria = $data['nomCategoria'] ?? null;
        $this->desCategoria = $data['desCategoria'] ?? null;
        $this->nomenCategoria = $data['nomenCategoria'] ?? null;
    }

    # Obtener categoría por ID
    public function obtenerPorId($id, $campo_id = 'idCategoria') {
        $data = parent::obtenerPorId($id, $campo_id);
        return $data ? new Categoria($data) : null;
    }
}