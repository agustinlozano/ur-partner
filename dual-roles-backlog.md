# 🏳️‍🌈 Dual Roles System - Implementation Backlog

> **Objetivo**: Implementar un sistema de roles inclusivo que separe la lógica interna (partner_a/partner_b) de la presentación visual (girlfriend/boyfriend/partner/etc.)

## 📋 **Backlog Overview**

**Estado**: 🟡 Planning  
**Prioridad**: Alta  
**Estimación total**: ~3-4 sprints

---

## 🎯 **PHASE 1: Foundation & Types**

_Prioridad: P0 (Crítico)_

### ✅ Task 1.1: Create TypeScript Interfaces

**Estimación**: 2h  
**Prioridad**: P0  
**Dependencias**: None

**Descripción**: Crear todas las interfaces TypeScript necesarias para el nuevo sistema de roles.

**Archivos a crear/modificar**:

- `lib/types/roles.ts` (nuevo)
- `lib/types/index.ts` (nuevo)

**Tareas específicas**:

- [x] Crear interface `UserRole` con logicRole y displayRole
- [x] Crear interface `RolePreset` para roles predefinidos
- [x] Crear interface `NewRoomFormat` extendiendo la actual
- [x] Crear types para `LogicRole` y `DisplayRole`
- [x] Agregar tipos para pronombres y roles customizables
- [x] Exportar todo desde `lib/types/index.ts`

---

### ✅ Task 1.2: Update DynamoDB Schema Types

**Estimación**: 1h  
**Prioridad**: P0  
**Dependencias**: Task 1.1

**Descripción**: Actualizar la interface `Room` en DynamoDB para incluir los nuevos campos sin romper compatibilidad.

**Archivos a modificar**:

- `lib/dynamodb.ts`

**Tareas específicas**:

- [ ] Extender interface `Room` con campos partner_a/partner_b
- [ ] Mantener campos legacy para backward compatibility
- [ ] Agregar tipos opcionales para los nuevos campos
- [ ] Documentar mapping entre old/new fields

---

### ✅ Task 1.3: Create Role Constants & Presets

**Estimación**: 1.5h  
**Prioridad**: P0  
**Dependencias**: Task 1.1

**Descripción**: Crear las constantes con roles predefinidos y configuración.

**Archivos a crear**:

- `lib/constants/role-presets.ts` (nuevo)

**Tareas específicas**:

- [ ] Definir `ROLE_PRESETS` con traditional/inclusive/custom
- [ ] Crear lista de emojis disponibles
- [ ] Definir límites para roles customizables
- [ ] Agregar pronombres predefinidos
- [ ] Crear utility functions para validación de roles

---

## 🔧 **PHASE 2: Database & Logic Layer**

_Prioridad: P0 (Crítico)_

### ✅ Task 2.1: Create Compatibility Layer

**Estimación**: 3h  
**Prioridad**: P0  
**Dependencias**: Task 1.1, 1.2

**Descripción**: Crear la capa de abstracción que mantiene compatibilidad entre formato legacy y nuevo.

**Archivos a crear**:

- `lib/utils/role-compatibility.ts` (nuevo)

**Tareas específicas**:

- [ ] Implementar `RoleCompatibilityLayer` class
- [ ] Método `toLegacyFormat()` - nuevo → legacy
- [ ] Método `fromLegacyFormat()` - legacy → nuevo
- [ ] Método `getLogicRole()` - obtener rol lógico del usuario
- [ ] Método `mapImageFields()` - mapear campos de imágenes
- [ ] Tests unitarios para todos los métodos
- [ ] Documentar casos edge y fallbacks

---

### ✅ Task 2.2: Update DynamoDB Actions

**Estimación**: 2h  
**Prioridad**: P0  
**Dependencias**: Task 2.1

**Descripción**: Actualizar las acciones de DynamoDB para manejar tanto formato legacy como nuevo.

**Archivos a modificar**:

- `lib/actions-dynamodb.ts`
- `lib/dynamodb.ts`

**Tareas específicas**:

- [ ] Modificar `createRoom()` para incluir nuevos campos
- [ ] Actualizar `updateRoom()` para manejar ambos formatos
- [ ] Modificar `findRoomByRoomId()` para retornar formato híbrido
- [ ] Agregar validación de roles en `joinRoom()`
- [ ] Mantener backward compatibility en todas las funciones

---

### ✅ Task 2.3: Update API Endpoints

**Estimación**: 1.5h  
**Prioridad**: P1  
**Dependencias**: Task 2.2

**Descripción**: Actualizar endpoints para manejar los nuevos campos de roles.

**Archivos a modificar**:

- `app/api/rooms/route.ts`
- `app/api/room-info/[roomId]/route.ts`

**Tareas específicas**:

- [ ] Actualizar validación en POST /api/rooms
- [ ] Modificar response format para incluir roles de display
- [ ] Agregar logging para transición de formatos
- [ ] Mantener API contracts existentes

---

## 🎨 **PHASE 3: UI Components**

_Prioridad: P1 (Alto)_

### ✅ Task 3.1: Create Role Selection Component

**Estimación**: 4h  
**Prioridad**: P1
**Dependencias**: Task 1.3, 2.1

**Descripción**: Componente principal para selección de roles inclusivos.

**Archivos a crear**:

- `components/role-selection.tsx` (nuevo)
- `components/role-card.tsx` (nuevo)
- `components/custom-role-builder.tsx` (nuevo)

**Tareas específicas**:

- [ ] Componente `RoleSelection` con modos preset/custom
- [ ] Componente `RoleCard` para mostrar roles predefinidos
- [ ] Componente `CustomRoleBuilder` para roles personalizados
- [ ] Validación de emojis y límites de caracteres
- [ ] Estados de loading y error
- [ ] Responsive design para mobile
- [ ] Accessibility (ARIA labels, keyboard navigation)

---

### ✅ Task 3.2: Update Create Room Flow

**Estimación**: 2h  
**Prioridad**: P1  
**Dependencias**: Task 3.1

**Descripción**: Integrar la nueva selección de roles en el flujo de creación de rooms.

**Archivos a modificar**:

- `components/create-room.tsx`
- `app/room/page.tsx`

**Tareas específicas**:

- [ ] Reemplazar select básico con `RoleSelection`
- [ ] Actualizar validación de formulario
- [ ] Mantener UX fluido en la transición
- [ ] Agregar preview del rol seleccionado
- [ ] Testing en diferentes breakpoints

---

### ✅ Task 3.3: Update Join Room Flow

**Estimación**: 2h  
**Prioridad**: P1  
**Dependencias**: Task 3.1, 2.2

**Descripción**: Actualizar el flujo de join para detectar rol disponible automáticamente.

**Archivos a modificar**:

- `components/join-room.tsx`
- `app/join/page.tsx`

**Tareas específicas**:

- [ ] Lógica para detectar logicRole disponible (partner_a vs partner_b)
- [ ] Integrar `RoleSelection` con exclusión de rol ocupado
- [ ] Mostrar información del partner ya en el room
- [ ] Validación y feedback de errores mejorado

---

## 🔄 **PHASE 4: Room Experience**

_Prioridad: P1 (Alto)_

### ✅ Task 4.1: Update Room Header & Display

**Estimación**: 2.5h  
**Prioridad**: P1  
**Dependencias**: Task 2.1

**Descripción**: Actualizar la UI del room para mostrar roles inclusivos.

**Archivos a modificar**:

- `app/room/[roomId]/page.tsx`
- `components/personality-form.tsx`

**Tareas específicas**:

- [ ] Crear componente `UserCard` para mostrar roles
- [ ] Actualizar `RoomHeader` con nueva información
- [ ] Mostrar pronombres cuando estén disponibles
- [ ] Adaptar textos para ser género-neutral por defecto
- [ ] Testing visual con diferentes combinaciones de roles

---

### ✅ Task 4.2: Update Personality Form

**Estimación**: 1.5h  
**Prioridad**: P1  
**Dependencias**: Task 4.1

**Descripción**: Actualizar el formulario de personalidad para usar la nueva lógica de roles.

**Archivos a modificar**:

- `hooks/use-personality-form.ts`
- `stores/personality-images-store.ts`

**Tareas específicas**:

- [ ] Actualizar hooks para usar `getLogicRole()`
- [ ] Modificar keys de storage para usar logicRole
- [ ] Mantener compatibilidad con datos existentes en sessionStorage
- [ ] Agregar migración automática de keys legacy

---

### ✅ Task 4.3: Update Reveal Experience

**Estimación**: 2h  
**Prioridad**: P2  
**Dependencias**: Task 4.1

**Descripción**: Actualizar la experiencia de reveal para mostrar roles personalizados.

**Archivos a modificar**:

- `components/reveal-content.tsx`
- `app/room/[roomId]/reveal/page.tsx`

**Tareas específicas**:

- [ ] Mostrar display roles en lugar de "girlfriend/boyfriend"
- [ ] Adaptar textos para ser inclusivos
- [ ] Actualizar componentes de gallery para mostrar roles custom
- [ ] Testing con diferentes combinaciones de roles

---

## 🔄 **PHASE 5: Migration & Cleanup**

_Prioridad: P2 (Medio)_

### ✅ Task 5.1: Create Migration Script

**Estimación**: 2h  
**Prioridad**: P2  
**Dependencias**: Task 2.2

**Descripción**: Script para migrar rooms existentes al nuevo formato.

**Archivos a crear**:

- `scripts/migrate-rooms-to-dual-roles.ts` (nuevo)

**Tareas específicas**:

- [ ] Script para migrar todas las rooms existentes
- [ ] Logging detallado del proceso de migración
- [ ] Rollback strategy en caso de errores
- [ ] Dry-run mode para testing
- [ ] Validación post-migración

---

### ✅ Task 5.2: Add Analytics & Monitoring

**Estimación**: 1h  
**Prioridad**: P3  
**Dependencias**: Task 3.1

**Descripción**: Agregar tracking para entender el uso de los nuevos roles.

**Archivos a modificar**:

- Componentes de role selection
- Analytics helpers

**Tareas específicas**:

- [ ] Track qué tipos de roles se eligen más
- [ ] Monitor errores en la transición
- [ ] Dashboard para ver adopción del nuevo sistema
- [ ] Alertas para issues críticos

---

## 📋 **PHASE 6: Testing & Polish**

_Prioridad: P2 (Medio)_

### ✅ Task 6.1: Comprehensive Testing

**Estimación**: 3h  
**Prioridad**: P2  
**Dependencias**: Tasks 3.x, 4.x

**Descripción**: Testing end-to-end del nuevo sistema de roles.

**Tests a crear**:

- [ ] Unit tests para RoleCompatibilityLayer
- [ ] Integration tests para room creation/joining
- [ ] E2E tests con diferentes combinaciones de roles
- [ ] Visual regression tests
- [ ] Performance tests con rooms migradas

---

### ✅ Task 6.2: Documentation Update

**Estimación**: 1h  
**Prioridad**: P3  
**Dependencias**: All previous tasks

**Descripción**: Actualizar documentación del proyecto.

**Archivos a modificar**:

- `project-description.md`
- `README.md`

**Tareas específicas**:

- [ ] Documentar nuevo sistema de roles
- [ ] Agregar ejemplos de uso
- [ ] Actualizar diagramas de arquitectura
- [ ] Guía de migración para desarrolladores

---

## 🎯 **Success Criteria**

- [ ] ✅ Parejas pueden elegir cualquier combinación de roles
- [ ] ✅ Sistema mantiene 100% backward compatibility
- [ ] ✅ No hay breaking changes en la experiencia actual
- [ ] ✅ Performance no se ve afectada
- [ ] ✅ Código es maintainable y extensible
- [ ] ✅ Tests cubren todos los casos edge

---

## 📊 **Progress Tracking**

**Phase 1**: ✅ 1/3 tasks completed  
**Phase 2**: ⏳ 0/3 tasks completed  
**Phase 3**: ⏳ 0/3 tasks completed  
**Phase 4**: ⏳ 0/3 tasks completed  
**Phase 5**: ⏳ 0/2 tasks completed  
**Phase 6**: ⏳ 0/2 tasks completed

**Overall Progress**: 1/16 tasks (6%) 🚀

---

## 📝 **Next Steps**

1. ✅ **Task 1.1 COMPLETED**: TypeScript interfaces created
2. **Current focus**: **Task 1.2** - Update DynamoDB schema types
3. **After that**: **Task 1.3** - Create role constants & presets
4. **Continue sequentially** following dependencies

**Ready to continue with Task 1.2! 💪**
