<?php
require_once __DIR__ . '/../configuración/conexion.php'; 

abstract class ModeloBase {
    protected $db;
    protected $tabla; // Nombre de la tabla debe ser definido por cada modelo 

    public function __construct() {
         $conexion = new Conexion();
        $this->db = $conexion->getConexion();
    }

    # Método para crear un registro
    public function crear($datos) {
        $campos = array_keys($datos);
        $valores = array_values($datos);

        $campos_sql = implode(', ', $campos);
        $placeholders = ':' . implode(', :', $campos);

        $sql = "INSERT INTO {$this->tabla} ({$campos_sql}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute($datos);
    }

    # Método para actualizar un registro
    public function actualizar($datos, $id, $campo_id = 'id') {
        $campos = array_keys($datos);
        $set = [];
        foreach ($campos as $campo) {
            $set[] = "$campo = :$campo";
        }
        $set_sql = implode(', ', $set);

        $sql = "UPDATE {$this->tabla} SET {$set_sql} WHERE {$campo_id} = :id";
        $stmt = $this->db->prepare($sql);

        $datos['id'] = $id;
        return $stmt->execute($datos);
    }

    # Método para eliminar un registro
    public function eliminar($id, $campo_id = 'id') {
        $sql = "DELETE FROM {$this->tabla} WHERE {$campo_id} = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }

    # Método para obtener un registro por ID
    public function obtenerPorId($id, $campo_id = 'id') {
        $sql = "SELECT * FROM {$this->tabla} WHERE {$campo_id} = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    # Método para listar todos los registros (devuelve arrays)
    public function listarTodosArray() {
        $sql = "SELECT * FROM {$this->tabla}";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    # Método para listar todos los registros (devuelve objetos del tipo del modelo)
    public function listarTodos() {
        $datos = $this->listarTodosArray();
        $objetos = [];
        foreach ($datos as $fila) {
            $clase = get_called_class(); // Obtiene la clase que llamó al método
            $objetos[] = new $clase($fila);
        }
        return $objetos;
    }
}