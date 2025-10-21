<?php
require_once __DIR__ . '/ModeloBase.php';
require_once __DIR__ . '/Usuario.php'; // Dependencia para obtener el proveedor
require_once __DIR__ . '/Categoria.php'; // Dependencia para obtener la categoría

class Servicio extends ModeloBase {
    protected $tabla = 'Servicio';

    # Propiedades
    public $idServicio;
    public $tituloServicio;
    public $estado;
    public $descripcionServicio;
    public $precioServicio;
    public $imagenServicio;
    public $idCategoria;
    public $idUsuario;

    public function __construct($data = []) {
        parent::__construct();

        $this->idServicio = $data['idServicio'] ?? null;
        $this->tituloServicio = $data['tituloServicio'] ?? null;
        $this->estado = $data['estado'] ?? null;
        $this->descripcionServicio = $data['descripcionServicio'] ?? null;
        $this->precioServicio = $data['precioServicio'] ?? null;
        $this->imagenServicio = $data['imagenServicio'] ?? null;
        $this->idCategoria = $data['idCategoria'] ?? null;
        $this->idUsuario = $data['idUsuario'] ?? null;
    }

    # Obtener el proveedor del servicio
    public function obtenerProveedor() {
        if (!$this->idUsuario) return null;
        $stmt = $this->db->prepare("SELECT * FROM Usuario WHERE idUsuario = ?");
        $stmt->execute([$this->idUsuario]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? new Usuario($data) : null;
    }

    # Obtener la categoría del servicio
    public function obtenerCategoria() {
        if (!$this->idCategoria) return null;
        $stmt = $this->db->prepare("SELECT * FROM Categoria WHERE idCategoria = ?");
        $stmt->execute([$this->idCategoria]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        return $data ? new Categoria($data) : null;
    }

    # Buscar servicios por categoría
    public function buscarPorCategoria($idCategoria) {
        $sql = "SELECT * FROM {$this->tabla} WHERE idCategoria = ? AND estado = 'activo'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$idCategoria]);
        $servicios = [];
        while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $servicios[] = new Servicio($fila);
        }
        return $servicios;
    }

    # Buscar servicios por proveedor
    public function buscarPorProveedor($idUsuario) {
        $sql = "SELECT * FROM {$this->tabla} WHERE idUsuario = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$idUsuario]);
        $servicios = [];
        while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $servicios[] = new Servicio($fila);
        }
        return $servicios;
    }

    # Buscar servicios por título o descripción
    public function buscarPorTexto($texto) {
        $sql = "SELECT * FROM {$this->tabla} WHERE (tituloServicio LIKE ? OR descripcionServicio LIKE ?) AND estado = 'activo'";
        $textoBusqueda = '%' . $texto . '%';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$textoBusqueda, $textoBusqueda]);
        $servicios = [];
        while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $servicios[] = new Servicio($fila);
        }
        return $servicios;
    }

    # Obtener servicio por ID 
    public function obtenerPorId($id, $campo_id = 'idServicio') {
        $data = parent::obtenerPorId($id, $campo_id);
        return $data ? new Servicio($data) : null;
    }
}