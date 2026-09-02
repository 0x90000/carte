# Carte Hands-off: Phase 1, Week 8+ 数据库备份

**状态**: 测试服务器每日 PostgreSQL 备份已实现并通过实际验收
**日期**: 2026-09-02
**依据**: `docs/tech-spec-detailed.md` Week 8+ 备份策略任务、第 13.8 节

## 本阶段交付

- 新增 `scripts/backup-postgres.sh`：
  - 默认从 `carte-postgres-1` 容器执行 `pg_dump`。
  - 使用 UTC 时间戳命名 `carte-YYYYMMDDTHHMMSSZ.sql.gz`。
  - 先写 `.tmp` 文件，确认非空后原子改名，失败时自动清理临时文件。
  - 使用 `gzip -9`，备份文件默认权限为 `600`。
  - 默认保留最近 7 天，可通过 `CARTE_BACKUP_RETENTION_DAYS` 调整。
  - `CARTE_BACKUP_DIR`、`CARTE_POSTGRES_CONTAINER`、`CARTE_POSTGRES_DB` 和 `CARTE_POSTGRES_USER` 可覆盖默认值。
- 新增 `npm run db:backup`，用于手工执行同一脚本。

## 本地代码验证

以下检查在本机执行；没有启动 Docker、PostgreSQL、Redis 或本地应用服务器：

```text
npm run lint       PASS
npx tsc --noEmit   PASS
git diff --check   PASS
```

Windows 本机没有可用的 WSL Bash，因此脚本语法检查和真实数据库备份在 Ubuntu 测试服务器完成。

## 测试服务器验收

部署目标为 Ubuntu 测试服务器 `/root/carte`，Carte 仍通过 `3010` 对外访问，没有使用 80/443；Node.js app 继续为 `v24.20.0`。

- 已上传并设置 `/root/carte/scripts/backup-postgres.sh` 权限为 `750`。
- `bash -n /root/carte/scripts/backup-postgres.sh` 通过。
- 使用隔离临时目录实际执行 `pg_dump`，生成文件后通过 `gzip -t` 和 PostgreSQL dump 内容检查；验证目录已清理。
- 已创建 `/var/backups/carte`（权限 `700`），并生成首个正式备份：
  - `carte-20260902T123114Z.sql.gz`
  - 文件权限 `600 root:root`
  - gzip 和 SQL 内容检查通过
- root crontab 已安装每日 03:00（服务器本地时间）任务，并使用 `/usr/bin/flock` 防止并发：

```cron
0 3 * * * /usr/bin/flock -n /run/lock/carte-postgres-backup.lock /root/carte/scripts/backup-postgres.sh >> /var/backups/carte/backup.log 2>&1
```

- PostgreSQL/Redis 数据卷未删除或重建，app 容器和 `3010` 服务未因备份配置中断。

## 运维边界

- 当前备份保存在测试服务器本地磁盘，已覆盖每日生成、压缩、权限和保留策略；尚未配置 S3/R2、异地复制、加密密钥托管或定期恢复演练。
- 真正生产上线前应将备份目录迁移到受控持久化存储，配置异地副本，并至少定期抽样恢复验证。
- 恢复操作必须先停止写入或选择维护窗口，并由运维人员确认目标数据库和备份文件后执行；本阶段不自动执行恢复。

## 提交

- `feat: add postgres backup job`（本阶段代码和文档）
