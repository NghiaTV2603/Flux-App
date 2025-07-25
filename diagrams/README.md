# Flux System Diagrams

Tập hợp các diagrams mô tả architecture và event flows của hệ thống Flux.

## 📁 Organization

```
diagrams/
├── README.md              # This file
├── architecture/          # System architecture diagrams
│   └── system-overview.*  # Overall system architecture
└── flows/                 # Event flow diagrams
    ├── user-registration.*
    ├── profile-update.*
    └── username-sync.*
```

## 🏗️ Architecture Diagrams

### System Overview

**File**: `architecture/system-overview`  
**Description**: High-level view của toàn bộ system architecture bao gồm:

- Client layer (Web/Mobile)
- Gateway layer (API Gateway)
- Service layer (Auth, User, Future services)
- Message layer (RabbitMQ)
- Data layer (PostgreSQL, Redis)

**Key Features Shown**:

- Service communication patterns
- Database relationships
- Event flow directions
- Port configurations

---

## 🔄 Event Flow Diagrams

### 1. User Registration Flow

**File**: `flows/user-registration`  
**Description**: Complete user registration process với event-driven profile creation.

**Flow Steps**:

1. Client gửi registration request
2. Auth Service tạo user record trong database
3. Publish `user.created` event to RabbitMQ
4. User Service consume event và tạo user profile
5. Return tokens to client

**Key Events**: `user.created`

### 2. Profile Update Flow

**File**: `flows/profile-update`  
**Description**: User profile update process với notification propagation.

**Flow Steps**:

1. Client update profile via Gateway
2. User Service update database
3. Publish `profile.updated` event
4. Notification Service (future) gửi alerts đến friends
5. Return success response

**Key Events**: `profile.updated`

### 3. Username Sync Flow

**File**: `flows/username-sync`  
**Description**: Username synchronization giữa Auth Service và User Service.

**Flow Steps**:

1. Username changed trong Auth Service
2. Publish `user.updated` event với new username
3. User Service consume event và sync username
4. Data consistency achieved across services

**Key Events**: `user.updated`

---

## 🎨 Diagram Types & Formats

### Sequence Diagrams

- **Tool**: Mermaid
- **Format**: `.mmd` source files
- **Use Case**: Event flows, service interactions
- **Style**: Detailed với participant labels và notes

### Architecture Diagrams

- **Tool**: Mermaid
- **Format**: `.mmd` source files
- **Use Case**: System overview, component relationships
- **Style**: Graph-based với subgraphs và clear labels

---

## 🔄 Usage Guidelines

### For Developers

1. **Understanding Flows**: Refer to sequence diagrams khi implement new features
2. **Debugging**: Use diagrams để trace issues across services
3. **Code Reviews**: Reference diagrams khi review cross-service changes

### For Architecture Updates

1. **Update Source**: Modify `.mmd` files khi có changes
2. **Version Control**: Commit diagram changes với code changes
3. **Documentation**: Update this README khi add new diagrams

### For Presentations

1. **Export**: Convert Mermaid to SVG/PNG for presentations
2. **Embed**: Reference diagrams trong docs và wikis
3. **Share**: Use as visual aids trong technical discussions

---

## 📋 Maintenance

### Adding New Diagrams

1. Create `.mmd` file trong appropriate folder
2. Add entry to this README
3. Update main ARCHITECTURE-DESIGN.md references

### Updating Existing Diagrams

1. Modify source `.mmd` file
2. Test rendering trong Mermaid tools
3. Update description trong README nếu cần

### Diagram Standards

- **Naming**: Use kebab-case for file names
- **Labels**: Clear, concise participant/node names
- **Notes**: Add explanatory notes for complex steps
- **Colors**: Use consistent color scheme (default Mermaid themes)

---

## 🛠️ Tools & Resources

### Mermaid Resources

- [Mermaid Documentation](https://mermaid-js.github.io/mermaid/)
- [Sequence Diagram Syntax](https://mermaid-js.github.io/mermaid/#/sequenceDiagram)
- [Graph Diagram Syntax](https://mermaid-js.github.io/mermaid/#/graph)

### Online Editors

- [Mermaid Live Editor](https://mermaid.live/)
- [GitLab Mermaid Renderer](https://docs.gitlab.com/ee/user/markdown.html#mermaid)
- [GitHub Mermaid Support](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)

### Export Tools

- **CLI**: `@mermaid-js/mermaid-cli` for batch conversion
- **VS Code**: Mermaid Preview extension
- **Browser**: Copy SVG from Mermaid Live Editor

---

**Last Updated**: January 2025  
**Maintained by**: Development Team
