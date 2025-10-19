<?php
require_once __DIR__ . '/Conexion.php';  

// Crear una instancia de la clase
$conexion = new Conexion();
$db = $conexion->getConexion();

// Probar la conexión
if ($db) {
    echo "✅ Conexión establecida correctamente.";
}
?>
