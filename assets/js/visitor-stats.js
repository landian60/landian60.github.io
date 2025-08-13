// 简化的访客统计系统
// Simplified Visitor Statistics System

class SimpleVisitorStats {
  constructor() {
    this.config = {
      storageKey: 'simple_visitor_stats',
      endpoint: 'https://ipapi.co/json/'
    };

    this.stats = {
      totalVisits: 0,
      lastVisit: null,
      visitors: {} // 存储访客位置信息
    };

    this.init();
  }

  async init() {
    try {
      this.loadStats();
      this.updateVisitCount();
      await this.fetchLocationData();
      this.updateTopLocations();
    } catch (error) {
      console.error('Visitor stats initialization failed:', error);
      this.showError();
    }
  }

  // 加载统计数据
  loadStats() {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        this.stats = { ...this.stats, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load stats data, using defaults:', error);
    }
  }

  // 更新访问计数
  updateVisitCount() {
    const now = Date.now();
    
    // 检查是否为新访问（4小时内不重复计数）
    if (!this.stats.lastVisit || (now - this.stats.lastVisit) > (4 * 60 * 60 * 1000)) {
      this.stats.totalVisits += 1;
      this.stats.lastVisit = now;
      this.saveStats();
      console.log(`New visit recorded. Total: ${this.stats.totalVisits}`);
    }

    // 更新显示
    this.updateElement('visitor-count', this.stats.totalVisits);
    this.updateElement('mobile-visitor-count', this.stats.totalVisits);
  }

  // 获取位置数据
  async fetchLocationData() {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.error) throw new Error(data.reason);

      this.updateLocationDisplay(data);
      this.saveVisitorLocation(data);
    } catch (error) {
      console.error('Failed to get location info:', error);
      this.updateLocationDisplay({ error: true });
    }
  }

  // 更新位置显示
  updateLocationDisplay(data) {
    if (data.error) {
      this.updateElement('location-text', 'Location unavailable');
      this.updateElement('ip-text', 'IP unavailable');
      this.updateElement('mobile-location-text', 'Location unavailable');
      return;
    }

    // 处理位置数据
    const location = this.formatLocation(data);
    const maskedIP = this.maskIP(data.ip);
    const flag = this.getCountryFlag(data.country_code);
    const displayLocation = flag ? `${flag} ${location}` : location;

    // 更新桌面版
    this.updateElement('location-text', displayLocation);
    this.updateElement('ip-text', maskedIP);
    
    // 更新移动版
    this.updateElement('mobile-location-text', displayLocation);
  }

  // 保存访客位置信息
  saveVisitorLocation(data) {
    if (!data.country_name || data.error) return;

    const now = Date.now();
    const country = data.country_name;
    
    if (!this.stats.visitors) {
      this.stats.visitors = {};
    }

    // 更新或创建国家访问记录
    if (!this.stats.visitors[country]) {
      this.stats.visitors[country] = {
        country: country,
        countryCode: data.country_code,
        flag: this.getCountryFlag(data.country_code),
        count: 0,
        lastVisit: now
      };
    }
    
    this.stats.visitors[country].count += 1;
    this.stats.visitors[country].lastVisit = now;

    // 清理3个月前的数据
    this.cleanOldVisitorData();
    
    this.saveStats();
  }

  // 清理旧的访客数据
  cleanOldVisitorData() {
    const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    Object.keys(this.stats.visitors).forEach(country => {
      const visitor = this.stats.visitors[country];
      if (visitor.lastVisit < threeMonthsAgo) {
        delete this.stats.visitors[country];
      }
    });
  }

  // 更新Top Locations显示
  updateTopLocations() {
    const listElement = document.getElementById('top-locations-list');
    if (!listElement) return;

    if (!this.stats.visitors || Object.keys(this.stats.visitors).length === 0) {
      listElement.innerHTML = '<div class="loading-indicator">No visitor data yet</div>';
      return;
    }

    // 排序并取前5名
    const topLocations = Object.values(this.stats.visitors)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (topLocations.length === 0) {
      listElement.innerHTML = '<div class="loading-indicator">No data available</div>';
      return;
    }

    // 生成HTML
    const html = topLocations.map(location => `
      <div class="location-item">
        <div class="location-name">
          <span>${location.flag || ''}</span>
          <span>${location.country}</span>
        </div>
        <div class="location-count">${location.count}</div>
      </div>
    `).join('');

    listElement.innerHTML = html;
    console.log('Top locations updated with', topLocations.length, 'locations');
  }

  // 获取国家旗帜emoji
  getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '';
    
    const flagMap = {
      'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷', 
      'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'CA': '🇨🇦',
      'AU': '🇦🇺', 'IN': '🇮🇳', 'BR': '🇧🇷', 'RU': '🇷🇺'
    };
    
    return flagMap[countryCode.toUpperCase()] || '';
  }

  // 掩码IP地址
  maskIP(ip) {
    if (!ip || ip === 'Unknown') return 'IP Hidden';
    
    if (ip.includes('.')) {
      // IPv4
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.*.***`;
    } else if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':');
      return parts.slice(0, 3).join(':') + ':****';
    }
    
    return 'IP Hidden';
  }

  // 格式化位置
  formatLocation(data) {
    const parts = [];
    if (data.city) parts.push(data.city);
    if (data.region) parts.push(data.region);
    if (data.country_name) parts.push(data.country_name);
    
    return parts.length > 0 ? parts.join(', ') : 'Location unknown';
  }

  // 更新元素
  updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  // 保存统计数据
  saveStats() {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.stats));
      console.log(`Stats saved. Total visits: ${this.stats.totalVisits}`);
    } catch (error) {
      console.warn('Failed to save stats:', error);
    }
  }

  // 显示错误
  showError() {
    this.updateElement('visitor-count', 'Error');
    this.updateElement('mobile-visitor-count', 'Error');
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.visitorStats = new SimpleVisitorStats();
  });
} else {
  window.visitorStats = new SimpleVisitorStats();
}
