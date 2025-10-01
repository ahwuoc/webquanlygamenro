interface AdminCommand {
  command: string;
  data?: string;
}

interface AdminResponse {
  success: boolean;
  message: string;
  error?: string;
}

class AdminService {
  private defaultBaseUrl = 'http://localhost:9090/admin';

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Check for custom URL from config
      if ((window as any).adminServerBaseUrl) {
        return (window as any).adminServerBaseUrl;
      }

      // Check localStorage
      const savedConfig = localStorage.getItem('admin-server-config');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          return parsed.baseUrl || this.defaultBaseUrl;
        } catch (error) {
          console.error('Failed to parse saved config:', error);
        }
      }
    }
    return this.defaultBaseUrl;
  }

  private async sendCommand(command: AdminCommand): Promise<AdminResponse> {
    try {
      const response = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      const text = await response.text();

      if (!response.ok) {
        return {
          success: false,
          message: text || 'Request failed',
          error: `HTTP ${response.status}`,
        };
      }

      const _isSuccess = text.includes('successfully') ||
        text.includes('completed') ||
        text.includes('started') ||
        text.includes('stopped') ||
        text.includes('restarted') ||
        this.isJsonResponse(text);

      const isWarning = text.includes('already running') ||
        text.includes('is not running') ||
        text.includes('may still be running');

      const isError = text.includes('Error') ||
        text.includes('Failed') ||
        text.includes('not found');

      // Determine success status
      let success = true;
      let error = undefined;

      if (isError) {
        success = false;
        error = 'Command failed';
      } else if (isWarning) {
        success = true; // Warning is still successful, just informational
        error = 'Warning';
      }

      return {
        success,
        message: text,
        error,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Network error or server unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private isJsonResponse(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  // Server Status Commands
  async getStatus(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'status' });
  }

  async getPlayerCount(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'players' });
  }

  async getThreadCount(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'threads' });
  }

  async getGameLoopStats(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'gameloop-stats' });
  }

  // Data Management Commands
  async saveClanData(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'saveclan' });
  }

  // Cache Management Commands
  async refreshMobCache(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'refresh-mob-cache' });
  }

  async refreshBossCache(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'refresh-boss-cache' });
  }

  async refreshGiftCache(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'refresh-gift-cache' });
  }

  // Announcement Commands
  async sendAnnouncement(message: string): Promise<AdminResponse> {
    return this.sendCommand({ command: 'announcement', data: message });
  }

  async sendVipAnnouncement(message: string): Promise<AdminResponse> {
    return this.sendCommand({ command: 'vip-announcement', data: message });
  }

  // Server Management Commands
  async startMaintenance(minutes?: number): Promise<AdminResponse> {
    return this.sendCommand({
      command: 'maintenance',
      data: minutes ? minutes.toString() : undefined
    });
  }

  async restartServer(minutes?: number): Promise<AdminResponse> {
    return this.sendCommand({
      command: 'restart',
      data: minutes ? minutes.toString() : undefined
    });
  }

  // Game Server Management Commands (Standalone Admin Server)
  async startGameServer(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'start-game' });
  }

  async stopGameServer(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'stop-game' });
  }

  async restartGameServer(delaySeconds?: number): Promise<AdminResponse> {
    return this.sendCommand({
      command: 'restart-game',
      data: delaySeconds ? delaySeconds.toString() : '10'
    });
  }

  async getGameServerStatus(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'game-status' });
  }

  async getGameServerLogs(lines?: number): Promise<AdminResponse> {
    return this.sendCommand({
      command: 'game-logs',
      data: lines ? lines.toString() : '100'
    });
  }

  async getAdminServerStatus(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'admin-status' });
  }

  async healthCheck(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'health-check' });
  }

  async forceKillGameServer(): Promise<AdminResponse> {
    return this.sendCommand({ command: 'force-kill' });
  }

  // Custom command for advanced users
  async sendCustomCommand(command: string, data?: string): Promise<AdminResponse> {
    return this.sendCommand({ command, data });
  }
}

export const adminService = new AdminService();
