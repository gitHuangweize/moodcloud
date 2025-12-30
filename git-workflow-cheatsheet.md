# Git 工作流操作速查表

## 基础状态查看
```bash
git status              # 查看工作目录状态
git log --oneline       # 查看提交历史（简洁版）
git log --graph --oneline --all  # 查看分支图
git branch              # 查看本地分支
git branch -a           # 查看所有分支（包括远程）
git remote -v           # 查看远程仓库信息
```

## 分支操作
```bash
# 创建分支
git branch <branch-name>                    # 创建新分支
git checkout -b <branch-name>               # 创建并切换到新分支

# 切换分支
git checkout <branch-name>                  # 切换到指定分支
git switch <branch-name>                     # 现代化的分支切换

# 删除分支
git branch -d <branch-name>                 # 删除已合并的分支
git branch -D <branch-name>                 # 强制删除分支
git push origin --delete <branch-name>      # 删除远程分支
```

## 文件操作
```bash
# 查看更改
git diff                     # 查看工作目录的更改
git diff --staged            # 查看暂存区的更改
git diff HEAD                # 查看所有更改

# 暂存操作
git add <file>               # 暂存指定文件
git add .                    # 暂存所有更改
git add -A                   # 暂存所有更改（包括删除）
git add -p                   # 交互式暂存

# 重置操作
git reset HEAD <file>        # 取消暂存文件
git checkout -- <file>      # 撤销工作目录的更改
git restore <file>          # 现代化的文件恢复
```

## 提交操作
```bash
# 基础提交
git commit -m "提交信息"                    # 提交暂存的更改
git commit -am "提交信息"                   # 暂存并提交所有更改

# 修改提交
git commit --amend                         # 修改最后一次提交
git commit --amend -m "新的提交信息"         # 修改提交信息

# 撤销操作
git reset --soft HEAD~1                    # 撤销最后一次提交（保留更改）
git reset --hard HEAD~1                    # 撤销最后一次提交（丢弃更改）
git revert <commit-hash>                   # 创建反向提交
```

## 远程操作
```bash
# 推送拉取
git push                                    # 推送到远程分支
git push origin <branch-name>              # 推送指定分支
git push -u origin <branch-name>           # 推送并设置上游分支
git pull                                    # 拉取并合并
git fetch                                   # 拉取但不合并

# 远程分支
git checkout -b <local-branch> origin/<remote-branch>  # 基于远程分支创建本地分支
```

## 合并操作
```bash
# 基础合并
git merge <branch-name>                     # 合并分支
git merge --no-ff <branch-name>            # 非快进合并（保留分支历史）

# 变基操作
git rebase <branch-name>                   # 变基到指定分支
git rebase -i HEAD~3                       # 交互式变基（修改最近3个提交）

# 冲突解决
git status                                  # 查看冲突文件
git add <conflicted-file>                  # 标记冲突已解决
git commit                                  # 完成合并提交
```

## 常用工作流

### Feature Branch 工作流
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# ... 编写代码 ...
git add .
git commit -m "feat: 添加新功能"

# 3. 推送分支
git push -u origin feature/new-feature

# 4. 合并到主分支
git checkout main
git pull origin main
git merge feature/new-feature
git push origin main

# 5. 清理
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### Git Flow 工作流
```bash
# 功能开发
git checkout -b feature/user-auth develop
# ... 开发 ...
git checkout develop
git merge feature/user-auth

# 发布准备
git checkout -b release/v1.0.0 develop
# ... 测试和修复 ...
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "版本 1.0.0"

# 热修复
git checkout -b hotfix/critical-bug main
# ... 修复 ...
git checkout main
git merge hotfix/critical-bug
git checkout develop
git merge hotfix/critical-bug
```

## 提交信息规范
```bash
# 格式：<类型>(<范围>): <描述>

# 类型
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式化
refactor: 重构
test:     测试相关
chore:    构建过程或辅助工具的变动

# 示例
feat(auth): 添加用户登录功能
fix(api): 修复用户列表接口错误
docs(readme): 更新安装说明
```

## 实用技巧
```bash
# 查看文件历史
git log -p <file>                          # 查看文件的详细历史
git blame <file>                           # 查看文件的每一行是谁修改的

# 暂存当前工作
git stash                                  # 暂存当前更改
git stash pop                              # 恢复暂存的更改
git stash list                             # 查看暂存列表

# 查找提交
git log --grep="关键词"                    # 搜索提交信息
git log --author="作者名"                   # 按作者搜索
git log --since="2023-01-01"               # 按时间搜索

# 清理操作
git clean -fd                              # 删除未跟踪的文件和目录
git gc                                     # 垃圾回收，优化仓库
```

## 配置设置
```bash
# 用户信息
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 编辑器
git config --global core.editor "vim"

# 别名设置
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
```

## 常见问题解决
```bash
# 撤销未提交的更改
git checkout -- <file>                     # 撤销单个文件
git reset --hard HEAD                      # 撤销所有更改

# 修改最后一次提交
git commit --amend                         # 修改提交信息或添加文件

# 回到某个提交
git reset --hard <commit-hash>             # 硬重置（丢弃所有后续提交）
git reset --soft <commit-hash>             # 软重置（保留更改）
git reset --mixed <commit-hash>            # 混合重置（默认）

# 解决合并冲突
git status                                 # 查看冲突文件
# 手动编辑冲突文件
git add <conflicted-file>                  # 标记已解决
git commit                                 # 完成合并
```
