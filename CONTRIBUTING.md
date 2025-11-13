# Guía de Contribución

## 🌟 Cómo Contribuir al Proyecto

¡Gracias por tu interés en contribuir! Este documento explica el proceso para contribuir al proyecto.

### 🔄 Flujo de Trabajo

1. **Fork y Clone**
   ```bash
   # Hacer fork en GitHub y luego clonar tu fork
   git clone https://github.com/TU_USUARIO/Red-Social-Quetzales.git
   cd Red-Social-Quetzales
   
   # Añadir el repositorio original como "upstream"
   git remote add upstream https://github.com/JuanSebastianBorja/Red-Social-Quetzales.git
   ```

2. **Mantener tu fork actualizado**
   ```bash
   # Obtener cambios del repo original
   git fetch upstream
   
   # Actualizar tu rama principal
   git checkout main
   git merge upstream/main
   ```

3. **Crear una rama para tus cambios**
   ```bash
   # Crear y cambiar a una nueva rama
   git checkout -b feature/nombre-descriptivo
   ```

4. **Hacer cambios y commits**
   ```bash
   # Añadir cambios
   git add .
   
   # Hacer commit con mensaje descriptivo
   git commit -m "tipo: descripción corta del cambio"
   ```
   
   Tipos de commit:
   - `feat`: Nueva característica
   - `fix`: Corrección de bug
   - `docs`: Cambios en documentación
   - `style`: Cambios de formato/estilo
   - `refactor`: Refactorización de código
   - `test`: Añadir/modificar tests
   - `chore`: Tareas de mantenimiento

5. **Subir cambios y crear Pull Request**
   ```bash
   # Subir tu rama al fork
   git push origin feature/nombre-descriptivo
   ```
   
   Luego:
   1. Ve a GitHub y crea un Pull Request
   2. Describe tus cambios detalladamente
   3. Referencia issues relacionados

### 📝 Estándares de Código

1. **JavaScript/Node.js**
   - Usar ES6+ features
   - Seguir el estilo existente del proyecto
   - Documentar funciones y métodos importantes

2. **Base de Datos**
   - Usar migraciones para cambios en esquema
   - Documentar cambios en modelos

3. **Tests**
   - Añadir tests para nuevas funcionalidades
   - Mantener o mejorar cobertura existente

### 🚀 Proceso de Review

1. Los revisores asignados revisarán tu PR
2. Haz los cambios solicitados si es necesario
3. Una vez aprobado, se hará merge a la rama principal

### ❗ Importante

- No subir archivos de configuración local (`.env`)
- Mantener secretos y credenciales fuera del código
- Seguir las convenciones de nombrado existentes
- Documentar cambios significativos

### 🤝 Código de Conducta

- Ser respetuoso con otros contribuidores
- Aceptar feedback constructivo
- Mantener discusiones profesionales
- Ayudar a otros cuando sea posible

¿Preguntas? Abre un issue o contacta a los mantenedores.