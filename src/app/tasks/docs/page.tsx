import React from 'react';
import { Card, Typography, Divider } from 'antd';

export default function TaskDocsPage() {
  const { Title, Text, Paragraph } = Typography;
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <Title level={2} style={{ marginTop: 0 }}>Task System - SQL-based Schema &amp; API</Title>
          <Paragraph type="secondary">
            Hệ thống Task được refactor từ hardcode sang SQL-based với các tính năng: quản lý requirements và rewards riêng biệt,
            hỗ trợ nhiều loại yêu cầu, cache hiệu năng và debug logging chi tiết.
          </Paragraph>
        </Card>

        <Card>
          <Title level={3}>Hướng dẫn quản lý</Title>
          <Paragraph>
            Từ trang <b>Tasks</b> (đường dẫn <code>/tasks</code>):
          </Paragraph>
          <ul>
            <li>
              Nhấn <b>Sửa Main</b> để chỉnh sửa thông tin <code>task_main_template</code> trực tiếp bằng Drawer trong trang danh sách.
            </li>
            <li>
              Nhấn <b>Quản lý Sub</b> để điều hướng tới trang chi tiết Task (<code>/tasks/{'{id}'}</code>) và tự động mở tab <b>Sub Tasks</b>.
            </li>
            <li>
              Trong tab <b>Sub Tasks</b>, nhấn <b>Sửa</b> tại từng dòng để mở trang chỉnh sửa Sub Task chuyên biệt
              (<code>/tasks/sub/{'{subId}'}</code>), nơi bạn có thể lưu và quay về trang Task chi tiết.
            </li>
            <li>
              Trong tab <b>Sub Tasks</b> có nút nhanh <b>Yêu cầu</b> và <b>Phần thưởng</b> để nhảy sang tab tương ứng và tự động lọc theo <code>task_sub_id</code> đã chọn.
            </li>
          </ul>
        </Card>

        <Card>
          <Title level={3}>Overview</Title>
          <ul>
            <li>Quản lý task requirements và rewards riêng biệt</li>
            <li>Support nhiều loại requirements: KILL_MOB, KILL_BOSS, TALK_NPC, PICK_ITEM, GO_TO_MAP</li>
            <li>Flexible map restrictions và conditions</li>
            <li>Cache system cho performance</li>
            <li>Debug logging chi tiết</li>
          </ul>
        </Card>

        <Card>
          <Title level={3}>Database Schema</Title>
          <Title level={4}>1. task_main_template</Title>
          <pre><code>{`CREATE TABLE task_main_template (
    id INT PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,               -- Tên task chính
    detail VARCHAR(255) NOT NULL              -- Mô tả chi tiết
);`}</code></pre>
          <Divider />
          <Title level={4}>2. task_sub_template</Title>
          <pre><code>{`CREATE TABLE task_sub_template (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_main_id INT NOT NULL,                -- FK to task_main_template
    NAME VARCHAR(255) NOT NULL,               -- Tên sub task
    max_count INT NOT NULL DEFAULT -1,        -- Số lượng cần hoàn thành
    notify VARCHAR(255) NOT NULL DEFAULT '',  -- Thông báo khi hoàn thành
    npc_id INT NOT NULL DEFAULT -1,           -- NPC liên quan
    map INT NOT NULL,                         -- Map của task
    FOREIGN KEY (task_main_id) REFERENCES task_main_template(id)
);`}</code></pre>
          <Divider />
          <Title level={4}>3. task_requirements</Title>
          <pre><code>{`CREATE TABLE task_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_main_id INT NOT NULL,                -- FK to task_main_template
    task_sub_id INT NOT NULL,                 -- Sub task index (0,1,2...)
    requirement_type ENUM('KILL_MOB', 'KILL_BOSS', 'TALK_NPC', 'PICK_ITEM', 'GO_TO_MAP', 'USE_ITEM') NOT NULL,
    target_id INT NOT NULL,                   -- mob_id, boss_id, npc_id, item_id, map_id
    target_count INT NOT NULL DEFAULT 1,      -- Số lượng cần hoàn thành
    map_restriction VARCHAR(100),             -- Map nào được tính (null = all maps)
    extra_data JSON,                          -- Data thêm nếu cần
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_task (task_main_id, task_sub_id),
    INDEX idx_type (requirement_type),
    INDEX idx_target (target_id)
);`}</code></pre>
          <Divider />
          <Title level={4}>4. task_rewards</Title>
          <pre><code>{`CREATE TABLE task_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_main_id INT NOT NULL,                -- FK to task_main_template
    task_sub_id INT NOT NULL,                 -- Sub task index (0,1,2...)
    reward_type ENUM('ITEM', 'GOLD', 'EXP', 'RUBY', 'POWER_POINT') NOT NULL,
    reward_id INT DEFAULT 0,                  -- item_id (nếu là item)
    reward_quantity BIGINT NOT NULL DEFAULT 1, -- Số lượng reward
    reward_description VARCHAR(200),          -- Mô tả reward
    INDEX idx_task (task_main_id, task_sub_id),
    INDEX idx_type (reward_type)
);`}</code></pre>
        </Card>

        <Card>
          <Title level={3}>Requirement Types</Title>
          <Paragraph>
            <b>KILL_MOB</b>: target_id = mob.tempId, target_count, map_restriction.
          </Paragraph>
          <Paragraph>
            <b>KILL_BOSS</b>: target_id = boss.id, target_count, map_restriction.
          </Paragraph>
          <Paragraph>
            <b>TALK_NPC</b>: target_id = npc.tempId, target_count (thường 1), map_restriction.
          </Paragraph>
          <Paragraph>
            <b>PICK_ITEM</b>: target_id = item.templateId, target_count, map_restriction.
          </Paragraph>
          <Paragraph>
            <b>GO_TO_MAP</b>: target_id = mapId, target_count (thường 1).
          </Paragraph>
          <Paragraph>
            <b>USE_ITEM</b>: target_id = item.templateId, target_count.
          </Paragraph>
        </Card>

        <Card>
          <Title level={3}>Reward Types</Title>
          <ul>
            <li><b>ITEM</b>: reward_id=item.templateId, reward_quantity, reward_description</li>
            <li><b>GOLD</b>: reward_id=0, reward_quantity</li>
            <li><b>EXP</b>: reward_id=0, reward_quantity</li>
            <li><b>RUBY</b>: reward_id=0, reward_quantity</li>
          </ul>
        </Card>

        <Card>
          <Title level={3}>Map Restrictions</Title>
          <ul>
            <li>"3" - chỉ map 3</li>
            <li>"1,2,3" - map 1 hoặc 2 hoặc 3</li>
            <li>"1-5" - map từ 1 đến 5</li>
            <li>"1-3,10,15-20" - kết hợp nhiều khoảng</li>
            <li>"!10" - tất cả map trừ map 10</li>
            <li>"!5-10" - tất cả map trừ map 5-10</li>
            <li>null - không giới hạn map</li>
          </ul>
        </Card>

        <Card>
          <Title level={3}>Sample Data</Title>
          <Title level={4}>Task 14: Nhiệm vụ đầu tiên</Title>
          <pre><code>{`-- Sub task 0: Gặp Rock ở map 1
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(14, 0, 'TALK_NPC', 0, 1, '1');

-- Sub task 1: Gặp Rock Rock ở map 2  
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(14, 1, 'TALK_NPC', 0, 1, '2');

-- Sub task 2: Giết 5 Khỉ Bư ở map 3
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(14, 2, 'KILL_MOB', 0, 5, '3');

-- Reward cho task 14_2
INSERT INTO task_rewards (task_main_id, task_sub_id, reward_type, reward_id, reward_quantity, reward_description) VALUES
(14, 2, 'EXP', 0, 1000, 'Hoàn thành nhiệm vụ giết Khỉ Bư');

-- Sub task 3: Quay về báo cáo Rock Rock
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(14, 3, 'TALK_NPC', 0, 1, '2');`}</code></pre>
          <Divider />
          <Title level={4}>Task 15: Gặp NPCs</Title>
          <pre><code>{`-- Sub task 0: Gặp Người Hướng Dẫn
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(15, 0, 'TALK_NPC', 105, 1, '2');

INSERT INTO task_rewards (task_main_id, task_sub_id, reward_type, reward_id, reward_quantity, reward_description) VALUES
(15, 0, 'EXP', 0, 500, 'Thưởng gặp NPC Hướng Dẫn');

-- Sub task 1-6: Gặp các NPCs khác
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(15, 1, 'TALK_NPC', 17, 1, '2'),   -- Bò Mộng
(15, 2, 'TALK_NPC', 16, 1, '3'),   -- Uron
(15, 3, 'TALK_NPC', 21, 1, '3'),   -- Bà Hạt Mít
(15, 4, 'TALK_NPC', 55, 1, '3'),   -- Berrus
(15, 5, 'TALK_NPC', 107, 1, '3'),  -- Thần Bí
(15, 6, 'TALK_NPC', 0, 1, '2');    -- Quay về Rock Rock`}</code></pre>
          <Divider />
          <Title level={4}>Task 16: Combat tasks</Title>
          <pre><code>{`-- Sub task 0: Gặp Berrus
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(16, 0, 'TALK_NPC', 55, 1, '3');

-- Sub task 1: Giết 50 Sói ở map 4
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(16, 1, 'KILL_MOB', 1, 50, '4');

INSERT INTO task_rewards (task_main_id, task_sub_id, reward_type, reward_id, reward_quantity, reward_description) VALUES
(16, 1, 'ITEM', 457, 5, 'Thưởng 5 Thỏi Vàng'),
(16, 1, 'GOLD', 0, 50000, 'Thưởng 50,000 vàng');

-- Sub task 2: Giết 100 Thay Ma ở map 4
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(16, 2, 'KILL_MOB', 2, 100, '4');`}</code></pre>
        </Card>

        <Card>
          <Title level={3}>API Usage</Title>
          <pre><code>{`// Task system sẽ tự động check khi player thực hiện actions
TaskServiceNew.getInstance().checkDoneTaskKillMob(player, mob);
TaskServiceNew.getInstance().checkDoneTaskKillBoss(player, boss);
TaskServiceNew.getInstance().checkDoneTaskTalkNpc(player, npc);
TaskServiceNew.getInstance().checkDoneTaskPickItem(player, item);
TaskServiceNew.getInstance().checkDoneTaskGoToMap(player, zone);`}</code></pre>
          <Title level={4}>Task Flow</Title>
          <ol>
            <li>Player thực hiện action</li>
            <li>TaskServiceNew check requirements từ cache</li>
            <li>Match requirement với action</li>
            <li>Check map restriction nếu có</li>
            <li>Increment progress</li>
            <li>Complete task nếu đủ target_count</li>
            <li>Give rewards</li>
            <li>Move to next sub task</li>
          </ol>
          <Title level={4}>Debug Logs</Title>
          <pre><code>{`TaskServiceNew: Player sdasd killed mob 0 at map 3
TaskServiceNew: Task requirement matched - TaskRequirement{task=14_2, type=KILL_MOB, target=0, count=5, map=3}
TaskServiceNew: Task progress 14_2: 4 + 1 = 5/5
TaskServiceNew: Task completed! TaskRequirement{task=14_2, type=KILL_MOB, target=0, count=5, map=3}
TaskServiceNew: Completing task 14_2 for player sdasd
TaskServiceNew: Giving reward TaskReward{task=14_2, type=EXP, id=0, quantity=1000} to player sdasd`}</code></pre>
        </Card>

        <Card>
          <Title level={3}>CLI Commands</Title>
          <Title level={4}>Task Cache Management</Title>
          <pre><code>{`refreshtaskcache    # Refresh task cache từ database
taskcachestats      # Xem thống kê task cache`}</code></pre>
          <Title level={4}>Sample Output</Title>
          <pre><code>{`TaskCache: Starting cache initialization...
TaskCache: Loading task requirements from database...
TaskCache: Loaded requirement: KILL_MOB target=0 count=5 for task 14_2
TaskCache: Loaded requirement: TALK_NPC target=0 count=1 for task 14_0
TaskCache: Successfully loaded 13 task requirements
TaskCache: Loading task rewards from database...
TaskCache: Loaded reward: EXP id=0 quantity=1000 for task 14_2
TaskCache: Successfully loaded 4 task rewards
TaskCache: Cache initialized successfully!`}</code></pre>
        </Card>

        <Card>
          <Title level={3}>Migration từ Hardcode</Title>
          <Title level={4}>Current Hardcode Tasks (Java)</Title>
          <pre><code>{`// Trong TaskService.java
case ConstMob.KHI_BU:
    if (mob.zone.map.mapId == 3) {
        doneTask(player, ConstTask.TASK_14_2);  // 28676
    }
    break;
case ConstMob.SOI:
    doneTask(player, ConstTask.TASK_16_1);      // 32770
    break;`}</code></pre>
          <Title level={4}>Migrated to SQL</Title>
          <pre><code>{`-- TASK_14_2: Giết Khỉ Bư ở map 3
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(14, 2, 'KILL_MOB', 0, 5, '3');

-- TASK_16_1: Giết Sói ở map 4  
INSERT INTO task_requirements (task_main_id, task_sub_id, requirement_type, target_id, target_count, map_restriction) VALUES
(16, 1, 'KILL_MOB', 1, 50, '4');`}</code></pre>
        </Card>

        <Card>
          <Title level={3}>Integration với hệ thống cũ</Title>
          <pre><code>{`// Trong Boss.java
TaskService.gI().checkDoneTaskKillBoss(plKill, this);          // Old system
TaskServiceNew.getInstance().checkDoneTaskKillBoss(plKill, this); // New system

// Trong Mob.java  
TaskService.gI().checkDoneTaskKillMob(plAtt, this);            // Old system
TaskServiceNew.getInstance().checkDoneTaskKillMob(plAtt, this);   // New system`}</code></pre>
        </Card>

        <Card>
          <Title level={3}>Performance Notes</Title>
          <ul>
            <li><b>Cache</b>: TaskCache load tất cả requirements và rewards vào memory</li>
            <li><b>Key</b>: "taskMainId_taskSubId" để lookup nhanh</li>
            <li><b>Thread-safe</b>: ConcurrentHashMap</li>
            <li><b>Auto-refresh</b>: CLI commands để reload từ DB</li>
          </ul>
          <Title level={4}>Indexes</Title>
          <ul>
            <li>idx_task: (task_main_id, task_sub_id)</li>
            <li>idx_type: requirement_type / reward_type</li>
            <li>idx_target: target_id</li>
          </ul>
        </Card>

        <Card>
          <Title level={3}>Contact</Title>
          <ul>
            <li><b>Developer</b>: Ahwuocdz</li>
            <li><b>Date Created</b>: September 14, 2025</li>
            <li><b>Last Updated</b>: September 15, 2025</li>
            <li><b>Version</b>: 1.0.0</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
