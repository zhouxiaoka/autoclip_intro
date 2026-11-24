(() => {
  'use strict';

  const RELEASES_URL = 'https://github.com/zhouxiaoka/autoclip/releases/latest';

  const COPY = {
    zh: {
      title: 'v1.6.0 游戏直播切片 | AutoClip',
      'meta.desc': 'AutoClip 1.6.0 现已发布：支持 GTA 6、黑神话：悟空、影之刃零等各类游戏直播。连上 OBS 或导入回放，下播自动挑出高光，本机导出各平台成片，开源免费、无月费。',
      'nav.home': '首页',
      'nav.sources': '6 大来源',
      'nav.gta6': '高光切法',
      'nav.checklist': '三步上手',
      'nav.cta': '下载 v1.6.0',
      'hero.badge': '游戏直播切片',
      'hero.soon': 'v1.6.0 现已发布',
      'hero.h1': '下播即出片，<br>高光自动留。',
      'hero.lede': 'GTA 6、黑神话：悟空、影之刃零，播什么都能剪。连上 OBS 或导入回放，高光、封面和文案直接拿去发。',
      'hero.cta.primary': '下载 v1.6.0',
      'hero.cta.secondary': '选择安装包',
      'hero.alt.note': 'v1.6.0 现已发布 · 支持 macOS / Windows · MIT 开源',
      'demo.bar': 'OBS 已连接 · 1.6.0',
      'demo.replay': '重播',
      'demo.file': 'GTA6_罪恶都市通宵实况.mkv',
      'demo.meta': '04:18:22 · 16.4 GB · 本地录像',
      'demo.tag': '已下播',
      'demo.p1': '抖音',
      'demo.p2': 'B 站',
      'demo.p3': 'TikTok',
      'demo.p4': 'Shorts',
      'demo.s1': '下播后自动开始处理',
      'demo.s1v': '自动接管',
      'demo.s2': '裁掉开播前后私人桌面',
      'demo.s2v': '秒级完成',
      'demo.s3': '挑出高光操作与第一反应',
      'demo.s3v': '8–45s',
      'demo.s4': '导出各平台成片与文案',
      'demo.s4v': '6 条待审',
      'demo.done.label': '本机完成 · 无需上传原片',
      'card1.tag': '抖音',
      'card1.title': '五星追车漂移反杀',
      'card2.tag': 'B 站',
      'card2.title': '残血弹反无伤过 Boss',
      'card3.tag': 'TikTok',
      'card3.title': '抢劫最后十秒翻车',
      'src.eyebrow': '6 大直播回放来源',
      'src.h2': '不管在哪开播，下播都进同一条流水线。',
      'src.lede': '从本机 OBS 录像到平台回放、采集卡文件，统一选好发布平台，一键出片。',
      'src.privacy.label': '隐私保障',
      'arch.eyebrow': '全品类游戏实况',
      'arch.h2': '一场长直播，自动剪出各平台成片。',
      'arch.lede': '从 GTA 6 开放世界到影之刃零、黑神话：悟空 Boss 战，不用计分板，也能自动重排横竖屏并配齐封面文案。',
      'board.src.tag': 'Twitch / OBS 直播原片',
      'board.bridge.label': '自动识别高光 + 主播摄像头分屏重排',
      'board.bridge.btn': 'AutoClip 1.6.0',
      'arch.1.src': '抖音 · 9:16',
      'arch.1.meta': '0:18 · GTA 6',
      'arch.1.h': '五星追车反杀',
      'arch.1.p': '8 秒以上的短漂移与瞬间反杀不再被误删。',
      'arch.1.t1': '8s+ 短动作保留',
      'arch.2.src': 'TikTok / Shorts',
      'arch.2.meta': '0:34 · 开黑',
      'arch.2.h': '抢劫十秒翻车',
      'arch.2.p': '顺延留住主播与队友的第一声尖叫和大笑。',
      'arch.2.t1': '留住第一反应',
      'arch.3.src': 'B 站 · 9:16',
      'arch.3.meta': '0:26 · 动作大作',
      'arch.3.h': '残血无伤过 Boss',
      'arch.3.p': 'GTA 6、影之刃零、黑神话等动作与开放世界通用。',
      'arch.3.t1': '全品类通用',
      'arch.4.src': 'YouTube / B 站 · 16:9',
      'arch.4.meta': '0:48 · 横屏攻略',
      'arch.4.h': '黄金海岸隐藏路线讲解',
      'arch.4.p': '横屏攻略与上摄像头下实况竖屏一次出齐。',
      'arch.4.t1': '横竖屏一次出齐',
      'arch.callout': '上方为按真实 Twitch / B 站实况构图还原的 1.6.0 切片示意。欢迎使用 v1.6.0 生成成片并投稿进入官网案例库。',
      'arch.submit': '投稿你的游戏切片 →',
      'ways.eyebrow': '为什么换掉老办法',
      'ways.h2': '不用熬夜翻录像，也不用排队传云端。',
      'ways.lede': '播完一整晚已经够累了，翻素材、去头尾和出片交给电脑自己跑。',
      'ways.a.k': '手动剪辑',
      'ways.a.p': '十几 G 录像拖进剪辑器找爆点、裁桌面、配字幕，往往熬到一半放弃。',
      'ways.b.k': '云端订阅工具',
      'ways.b.file': '正在上传 16.4 GB...',
      'ways.b.pct': '24% · 排队中',
      'ways.b.t1': '热门时段排队',
      'ways.b.t2': '按月付费 $19–$49',
      'ways.b.p': '先传大文件再等排队，每个月还要为额度交订阅费。',
      'ways.c.k': 'AutoClip 1.6.0',
      'ways.c.btn': '下播自动接管',
      'ways.c.1': '下播自动接管，秒裁私人桌面',
      'ways.c.2': '自动挑出高光与第一反应',
      'ways.c.3': '拿到成片、封面和各平台文案',
      'ways.c.p': '全程本机完成，开源免费，无月费。',
      'stat.1.v': '0 秒',
      'stat.1.l': '大文件上传等待，全程本机处理',
      'stat.2.v': '秒级裁剪',
      'stat.2.l': '自动裁掉开播前后私人桌面，不损画质',
      'stat.3.v': '8–45s',
      'stat.3.l': '短动作与第一反应两类高光完整留存',
      'stat.4.v': '无月费',
      'stat.4.l': '软件开源免费，按自有 Key 实耗或跑本地模型',
      'story.eyebrow': '三步上手',
      'story.h2': '开播前花三分钟设好，下播直接去睡。',
      'story.1.h': '连上 OBS，设好隐私裁剪与预算',
      'story.1.p': '打开 OBS 连接，选好前后裁掉几分钟，再设一个单场费用上限就行。',
      'story.1.k1': 'OBS 联动',
      'story.1.v1': '自动识别下播',
      'story.1.k2': '隐私保护',
      'story.1.v2': '自动裁掉前后桌面',
      'story.1.k3': '单场预算',
      'story.1.v3': '可设 AI 次数上限',
      'story.2.h': '或直接导入 Twitch / 采集卡录像',
      'story.2.p': '没开自动监听也没关系，Twitch 回放、主机采集卡和本地录屏都能随时补导。',
      'story.2.i1': 'OBS 自动接管',
      'story.2.v1': '下播自动开始',
      'story.2.i2': 'Twitch 回放',
      'story.2.v2': '后台拉取不卡界面',
      'story.2.i3': '主机采集卡 / 录屏',
      'story.2.v3': '直接选中文件开剪',
      'story.3.h': '睡醒五分钟审片，一套发全网',
      'story.3.p': '按高光主题快速回看，挑中满意的直接拿走各平台成片、封面和文案。',
      'story.3.k': '交付包 · 游戏实况',
      'story.3.title': '五星追车穿巷极限反杀，全队语音直接炸锅',
      'story.3.f1': '成片_9x16.mp4',
      'story.3.f2': '成片_16x9.mp4',
      'story.3.f3': '封面.jpg + 文案.txt',
      'story.3.b1': '复制文案',
      'story.3.b2': '导出交付包',
      'cmp.eyebrow': '本地开源 vs 云端订阅',
      'cmp.h2': '大作连播时，最不需要排队和月费账单。',
      'cmp.col.a': 'AutoClip 1.6.0',
      'cmp.col.b': '云端游戏切片订阅工具',
      'cmp.1.l': '十几 G 原片',
      'cmp.1.a': '本机直接处理，免上传、秒级裁掉私人桌面',
      'cmp.1.b': '需先上传云端，热门时段容易排队',
      'cmp.2.l': '费用',
      'cmp.2.a': '软件开源免费，按自有 Key 实耗计费，可设单场上限',
      'cmp.2.b': '按月订阅（常见 $19–$49/月），按分钟计额度',
      'cmp.3.l': '隐私',
      'cmp.3.a': '录像全程不离本机，私人桌面先裁再分析',
      'cmp.3.b': '整场录像上传至第三方服务器',
      'cmp.4.l': '多平台适配',
      'cmp.4.a': '抖音、小红书、B 站、TikTok、Reels、Shorts 一次打包',
      'cmp.4.b': '以海外竖屏为主，中文平台适配弱',
      'cmp.5.l': '高光可控',
      'cmp.5.a': '分组审片，保留 8–45 秒动作与第一反应',
      'cmp.5.b': '黑盒自动出片，短动作或反应常被切丢',
      'cta.eyebrow': 'v1.6.0 现已发布',
      'cta.h2': '下载 AutoClip 1.6.0，下播即接管你的实况录像。',
      'cta.lede': '支持 Apple Silicon macOS 与 Windows x64，内置便携运行环境，下载即用。',
      'cta.releases': '前往 GitHub Releases 下载',
      'cta.docs': '返回官网首页',
      'dl.mac.req': 'Apple Silicon（M 系列）· macOS 13 及以上。内置便携运行环境，开箱即用。',
      'dl.mac.btn': '下载 macOS 版 (.dmg)',
      'dl.win.req': 'Windows 10 / 11，x64。免管理员权限，内置便携运行环境，开箱即用。',
      'dl.win.btn': '下载 Windows 版 (.exe)',
      'share.title': '发给一起开黑的主播或剪辑师',
      'share.desc': '复制本页链接发到开黑群或 Discord，一起用 v1.6.0 自动切高光。',
      'share.btn': '复制本页链接',
      'share.copied': '已复制，去群里粘贴',
      'disclaimer': '商标与素材说明：Grand Theft Auto / GTA 6 为 Rockstar Games / Take-Two Interactive 注册商标；提及的游戏作品商标归各自权利人所有。AutoClip 为独立开源工具，与上述厂商无官方关联。本页画面为原创艺术插画与拼贴示意，非游戏实机截图。'
    },
    en: {
      title: 'Game Stream Clipping · AutoClip v1.6.0',
      'meta.desc': 'Now in AutoClip 1.6.0: local game stream clipping for GTA 6, Black Myth: Wukong, Phantom Blade Zero and more. Connect OBS or import a VOD, get ready-to-post clips locally. Open source, no monthly plan.',
      'nav.home': 'Home',
      'nav.sources': '6 sources',
      'nav.gta6': 'Highlights',
      'nav.checklist': '3-step setup',
      'nav.cta': 'Download v1.6.0',
      'hero.badge': 'Game stream clipping',
      'hero.soon': 'Now in v1.6.0',
      'hero.h1': 'Stream ends.<br><em>Highlights stay.</em>',
      'hero.lede': 'GTA 6, Black Myth: Wukong, Phantom Blade Zero — any game you play. Connect OBS or import a VOD, and get clips, covers and copy locally.',
      'hero.cta.primary': 'Download v1.6.0',
      'hero.cta.secondary': 'Choose installer',
      'hero.alt.note': 'v1.6.0 available now · macOS & Windows · MIT open source',
      'demo.bar': 'OBS connected · v1.6.0',
      'demo.replay': 'Replay',
      'demo.file': 'GTA6_ViceCity_LateNight.mkv',
      'demo.meta': '04:18:22 · 16.4 GB · Local file',
      'demo.tag': 'Offline',
      'demo.p1': 'Douyin',
      'demo.p2': 'Bilibili',
      'demo.p3': 'TikTok',
      'demo.p4': 'Shorts',
      'demo.s1': 'Auto-starts after stream ends',
      'demo.s1v': 'Auto',
      'demo.s2': 'Trim pre/post private desktop',
      'demo.s2v': 'Instant',
      'demo.s3': 'Pick action + first-reaction peaks',
      'demo.s3v': '8–45s',
      'demo.s4': 'Export ready-to-post kits',
      'demo.s4v': '6 ready',
      'demo.done.label': 'Done locally · 0 GB uploaded',
      'card1.tag': 'Douyin',
      'card1.title': '5-star drift escape clutch',
      'card2.tag': 'Bilibili',
      'card2.title': '1-HP parry boss clear',
      'card3.tag': 'TikTok',
      'card3.title': 'Heist blown with 10s left',
      'src.eyebrow': '6 replay sources',
      'src.h2': 'Wherever you stream, every replay lands in one flow.',
      'src.lede': 'OBS recordings, platform VODs or console capture files — pick your target platforms and export locally.',
      'src.privacy.label': 'Privacy',
      'arch.eyebrow': 'Every game genre',
      'arch.h2': 'One marathon stream, ready-to-post clips for every platform.',
      'arch.lede': 'From GTA 6 open-world chaos to Phantom Blade Zero and Black Myth: Wukong boss fights — auto-reframed with facecam, covers and copy.',
      'board.src.tag': 'Twitch / OBS live VOD',
      'board.bridge.label': 'Highlight detection + facecam split-screen reframe',
      'board.bridge.btn': 'AutoClip 1.6.0',
      'arch.1.src': 'Douyin · 9:16',
      'arch.1.meta': '0:18 · GTA 6',
      'arch.1.h': '5-star drift escape clutch',
      'arch.1.p': 'Short 8s+ stunts stay intact instead of getting dropped.',
      'arch.1.t1': '8s+ short beats',
      'arch.2.src': 'TikTok / Shorts',
      'arch.2.meta': '0:34 · Squad reaction',
      'arch.2.h': 'Heist blown with 10s left',
      'arch.2.p': 'Holds past the moment to keep the gasp and squad laugh.',
      'arch.2.t1': 'Keep first reaction',
      'arch.3.src': 'Bilibili · 9:16',
      'arch.3.meta': '0:26 · Phantom Blade / Wukong',
      'arch.3.h': '1-HP parry boss clear',
      'arch.3.p': 'Built for GTA 6, Phantom Blade Zero, Wukong and more.',
      'arch.3.t1': 'Every game genre',
      'arch.4.src': 'YouTube / Bilibili · 16:9',
      'arch.4.meta': '0:48 · Walkthrough',
      'arch.4.h': 'Coastal secret route guide',
      'arch.4.p': 'Landscape guides and vertical facecam cuts in one run.',
      'arch.4.t1': '16:9 + 9:16 together',
      'arch.callout': 'Frames above model real Twitch / Bilibili stream framing in v1.6.0. Try v1.6.0 and submit your real clips to the showcase.',
      'arch.submit': 'Submit your stream clips →',
      'ways.eyebrow': 'Why switch',
      'ways.h2': 'Skip late-night scrubbing and cloud upload queues.',
      'ways.lede': 'After a long stream, let your computer handle trimming, picking and packaging.',
      'ways.a.k': 'Manual editing',
      'ways.a.p': 'Scrubbing a 15 GB recording at 3 AM for highlights and captions burns you out fast.',
      'ways.b.k': 'Cloud subscriptions',
      'ways.b.file': 'Uploading 16.4 GB...',
      'ways.b.pct': '24% · Queued',
      'ways.b.t1': 'Peak-hour queues',
      'ways.b.t2': '$19–$49/mo plans',
      'ways.b.p': 'Upload gigabytes first, wait in queues, and pay every month.',
      'ways.c.k': 'AutoClip 1.6.0',
      'ways.c.btn': 'Auto post-stream',
      'ways.c.1': 'Auto-starts after OBS stops, trims desktop fast',
      'ways.c.2': 'Picks action peaks plus first reactions',
      'ways.c.3': 'Delivers clips, covers and platform copy',
      'ways.c.p': 'Runs locally. Open source, free, no monthly plan.',
      'stat.1.v': '0 sec',
      'stat.1.l': 'Waiting on multi-GB cloud uploads',
      'stat.2.v': 'Instant trim',
      'stat.2.l': 'Cuts pre/post desktop in seconds with zero quality loss',
      'stat.3.v': '8–45s',
      'stat.3.l': 'Keeps both short stunts and full reactions',
      'stat.4.v': 'No sub',
      'stat.4.l': 'Free open-source app; bring your own key or local model',
      'story.eyebrow': '3-step setup',
      'story.h2': 'Three minutes before you go live. Sleep right after.',
      'story.1.h': 'Connect OBS, privacy trim & budget',
      'story.1.p': 'Turn on OBS connection, pick how many minutes to trim at start/end, and set a per-session budget cap.',
      'story.1.k1': 'OBS link',
      'story.1.v1': 'Detects stream end',
      'story.1.k2': 'Privacy trim',
      'story.1.v2': 'Cuts head & tail desktop',
      'story.1.k3': 'Budget cap',
      'story.1.v3': 'Custom AI call limit',
      'story.2.h': 'Or import Twitch / capture recordings',
      'story.2.p': 'Pull recent Twitch VODs quietly in the background, or drop in PS5 capture and local files anytime.',
      'story.2.i1': 'OBS auto-capture',
      'story.2.v1': 'Starts once saved',
      'story.2.i2': 'Twitch VODs',
      'story.2.v2': 'Background fetch',
      'story.2.i3': 'Console capture / local',
      'story.2.v3': 'Pick file and go',
      'story.3.h': 'Review in 5 minutes, post everywhere',
      'story.3.p': 'Browse candidates grouped by topic and grab finished clips, covers and copy for every platform.',
      'story.3.k': 'Publish kit · Game stream',
      'story.3.title': '5-star alley clutch — entire squad loses it on comms',
      'story.3.f1': 'clip_9x16.mp4',
      'story.3.f2': 'clip_16x9.mp4',
      'story.3.f3': 'cover.jpg + post.txt',
      'story.3.b1': 'Copy text',
      'story.3.b2': 'Export kit',
      'cmp.eyebrow': 'Local open source vs cloud plans',
      'cmp.h2': 'Skip the upload queue and the monthly subscription.',
      'cmp.col.a': 'AutoClip 1.6.0',
      'cmp.col.b': 'Cloud clipping subscriptions',
      'cmp.1.l': 'Multi-GB VODs',
      'cmp.1.a': 'Processed locally; instant desktop trim, zero upload',
      'cmp.1.b': 'Upload first; peak-hour server queues',
      'cmp.2.l': 'Pricing',
      'cmp.2.a': 'Free MIT app; pay only your own API usage with caps',
      'cmp.2.b': 'Monthly plans ($19–$49/mo) with minute caps',
      'cmp.3.l': 'Privacy',
      'cmp.3.a': 'Raw VODs stay on your PC; desktop trimmed before analysis',
      'cmp.3.b': 'Full recordings uploaded to third-party servers',
      'cmp.4.l': 'Platforms',
      'cmp.4.a': 'TikTok, Shorts, Reels, YouTube, Douyin, Bilibili & XHS',
      'cmp.4.b': 'Mostly Western vertical platforms',
      'cmp.5.l': 'Control',
      'cmp.5.a': 'Grouped review keeping 8–45s stunts and reactions',
      'cmp.5.b': 'Black-box cuts that drop short plays or reactions',
      'cta.eyebrow': 'Now in v1.6.0',
      'cta.h2': 'Download AutoClip 1.6.0 — turn tonight’s stream into clips.',
      'cta.lede': 'Built for Apple Silicon macOS and Windows x64 with Python and FFmpeg bundled.',
      'cta.releases': 'Download on GitHub Releases',
      'cta.docs': 'Back to home',
      'dl.mac.req': 'Apple Silicon (M-series) · macOS 13+. Portable runtime bundled — ready out of the box.',
      'dl.mac.btn': 'Download macOS (.dmg)',
      'dl.win.req': 'Windows 10 / 11, x64. Per-user install with portable runtime bundled.',
      'dl.win.btn': 'Download Windows (.exe)',
      'share.title': 'Share with your squad or editor',
      'share.desc': 'Drop this link in Discord or your creator group so everyone can try v1.6.0.',
      'share.btn': 'Copy page link',
      'share.copied': 'Link copied',
      'disclaimer': 'Trademark & artwork notice: Grand Theft Auto / GTA 6 is a registered trademark of Rockstar Games / Take-Two Interactive; all other game titles belong to their respective owners. AutoClip is an independent open-source tool with no official affiliation. Visuals are original stylized illustrations, not in-game footage.'
    }
  };

  const SOURCES = [
    {
      id: 'obs',
      icon: 'assets/sources/obsstudio.svg',
      zh: {
        name: 'OBS Studio',
        mode: '自动出片',
        short: '连上 OBS，下播自动裁桌面并出片',
        summary: '本地直播最省心的接法。下播后自动开始处理，也可以随时挑一场旧录像补剪。',
        steps: [
          '在 OBS 打开连接开关，设好开播前后要裁掉的时长。',
          '下播保存完录像后，自动秒级裁掉私人桌面。',
          '按预算上限挑出高光，睡醒回首页分组审片。'
        ],
        privacy: '原始大录像全程留在本机，裁掉的私人桌面不会参与分析。'
      },
      en: {
        name: 'OBS Studio',
        mode: 'Auto',
        short: 'Detects stream end and trims automatically',
        summary: 'The easiest local setup. Starts right after your stream ends, or lets you pick any past recording.',
        steps: [
          'Enable OBS connection and pick how many minutes to trim at start/end.',
          'Once saved, AutoClip trims private desktop windows in seconds.',
          'Finds highlights within your budget cap and groups clips for review.'
        ],
        privacy: 'Raw recordings stay on your disk; trimmed desktop windows are excluded.'
      }
    },
    {
      id: 'twitch',
      icon: 'assets/sources/twitch.svg',
      zh: {
        name: 'Twitch',
        mode: '回放直导',
        short: '登录后直接挑近期回放，后台拉取',
        summary: '授权登录即可看到最近的 Twitch 回放列表，点选后在后台拉取，完成后选平台出片。',
        steps: [
          '在直播回放页连接你的 Twitch 账号。',
          '选中想剪的场次，后台静默下载，不卡界面。',
          '回到首页选好发布平台，一键生成成片。'
        ],
        privacy: '登录信息只保存在本机，下载和出片全部本地完成。'
      },
      en: {
        name: 'Twitch',
        mode: 'VOD import',
        short: 'Sign in, pick a recent VOD, fetch quietly',
        summary: 'Connect Twitch once to browse recent broadcasts. Selected VODs download in the background.',
        steps: [
          'Connect your Twitch account in Live Replays.',
          'Pick a recent VOD — it downloads quietly in the background.',
          'Choose your target platforms on Home and export.'
        ],
        privacy: 'Login stays local; downloaded VODs and renders stay on your PC.'
      }
    },
    {
      id: 'youtube',
      icon: 'assets/sources/youtube.svg',
      zh: {
        name: 'YouTube',
        mode: '导入录像',
        short: '查看近期直播场次，关联本地录像',
        summary: '连接账号查看近期直播记录，搭配从后台导出的原片或本地副本直接开剪。',
        steps: [
          '连接 YouTube 查看近期直播场次与时长。',
          '从 YouTube Studio 导出录像，或选本地同步录制的副本。',
          '关联文件后回到首页选平台出片。'
        ],
        privacy: '只查看场次列表，不改动频道内容，全程本机处理。'
      },
      en: {
        name: 'YouTube',
        mode: 'Import',
        short: 'Browse past streams, attach local export',
        summary: 'View your recent YouTube live streams, then attach your Studio export or local copy to clip.',
        steps: [
          'Connect YouTube to see recent live streams in one list.',
          'Download the archive from YouTube Studio or pick your local copy.',
          'Attach the file and send it through the Home export flow.'
        ],
        privacy: 'Read-only stream list; your channel is untouched and editing stays local.'
      }
    },
    {
      id: 'kick',
      icon: 'assets/sources/kick.svg',
      zh: {
        name: 'Kick',
        mode: '本地导入',
        short: '导入本机录像或回放，直接出高光',
        summary: '把 OBS 同步录下的本地文件或 Kick 回放直接拖进 AutoClip，同样秒级去头尾出片。',
        steps: [
          '开播时同步本地录制，或准备好保存的回放视频。',
          '直接导入 AutoClip，按需裁掉开播前后画面。',
          '导出适配抖音、TikTok、Shorts 的成片交付包。'
        ],
        privacy: '无需提供账号密码，所有素材都在本机处理。'
      },
      en: {
        name: 'Kick',
        mode: 'Local',
        short: 'Drop local OBS or archived Kick files',
        summary: 'Drop your local OBS recording or saved Kick VOD right into AutoClip for the same highlight flow.',
        steps: [
          'Record locally while streaming, or save your Kick VOD.',
          'Import into AutoClip and trim start/end screens if needed.',
          'Export ready-to-post vertical and landscape kits locally.'
        ],
        privacy: 'No Kick credentials needed; 100% local processing.'
      }
    },
    {
      id: 'discord',
      icon: 'assets/sources/discord.svg',
      zh: {
        name: 'Discord 开黑',
        mode: '本地导入',
        short: '连麦翻车名场面，操作和反应一起留',
        summary: '导入带语音连麦的本地录屏，把高光操作和队友的第一声大笑、吐槽一起留下来。',
        steps: [
          '录下包含游戏画面与队友语音的本地视频。',
          '导入后自动锁定 18–45 秒「操作 + 反应」高光。',
          '挑出最爆笑的几段，直接发群里或短视频平台。'
        ],
        privacy: '私人连麦语音只在本机处理，不上传云端视频库。'
      },
      en: {
        name: 'Discord Squads',
        mode: 'Local',
        short: 'Keep squad comms + reactions together',
        summary: 'Import local recordings with Discord voice chat so both the play and the instant squad reaction stay.',
        steps: [
          'Record gameplay and Discord voice audio together locally.',
          'AutoClip detects 18–45s play-plus-reaction peaks.',
          'Review the funniest picks and export for Shorts or Discord.'
        ],
        privacy: 'Private voice chat stays on your computer.'
      }
    },
    {
      id: 'capture',
      icon: 'assets/sources/folder.svg',
      zh: {
        name: '采集卡 / 显卡录屏',
        mode: '本地导入',
        short: 'PS5 / Xbox 采集卡与显卡录屏直剪',
        summary: '主机玩家玩 GTA 6、黑神话或影之刃零的首选，高画质原片不用压缩上传，选中直接剪。',
        steps: [
          '把采集卡或显卡保存的录像放到常用文件夹。',
          '在 AutoClip 直接选中原片，免上传等待。',
          '自动筛出高光，一键导出横屏攻略与竖屏短片。'
        ],
        privacy: '大体积高清录像直接在本机处理，不占云端空间。'
      },
      en: {
        name: 'Capture / GPU Replay',
        mode: 'Local',
        short: 'PS5 / Xbox capture cards & GPU replays',
        summary: 'Ideal for console players on GTA 6, Wukong or Phantom Blade Zero — pick raw captures straight from disk.',
        steps: [
          'Save your capture card or GPU replay recordings locally.',
          'Select the raw file directly in AutoClip — no upload.',
          'Extract highlights and export landscape and vertical kits.'
        ],
        privacy: 'High-bitrate captures stay local on your machine.'
      }
    }
  ];

  const ATTR = { zh: 'zh-CN', en: 'en', ja: 'ja', ko: 'ko', es: 'es', pt: 'pt-BR', ru: 'ru', fr: 'fr' };
  const isWin = /Windows/i.test(navigator.userAgent) || (navigator.userAgentData && navigator.userAgentData.platform === 'Windows');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let currentLang = 'zh';
  let activeSourceId = 'obs';

  function dict(lang) {
    return COPY[lang] || COPY.en;
  }

  function renderSourceList() {
    const list = document.getElementById('gs-src-list');
    if (!list) return;
    const lk = currentLang === 'zh' ? 'zh' : 'en';
    list.innerHTML = '';
    SOURCES.forEach((src) => {
      const s = src[lk];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gs-src-btn';
      btn.dataset.sourceId = src.id;
      btn.setAttribute('aria-pressed', src.id === activeSourceId ? 'true' : 'false');
      btn.innerHTML =
        '<div class="gs-src-head">' +
          '<span class="gs-src-icon"><img src="' + src.icon + '" alt="" width="18" height="18"></span>' +
          '<span class="gs-src-mode">' + s.mode + '</span>' +
        '</div>' +
        '<div>' +
          '<div class="gs-src-name">' + s.name + '</div>' +
          '<div class="gs-src-sub">' + s.short + '</div>' +
        '</div>';
      btn.addEventListener('click', () => {
        activeSourceId = src.id;
        renderSourceList();
        renderSourceDetail();
      });
      list.appendChild(btn);
    });
  }

  function renderSourceDetail() {
    const box = document.getElementById('gs-src-detail');
    if (!box) return;
    const lk = currentLang === 'zh' ? 'zh' : 'en';
    const d = dict(currentLang);
    const src = SOURCES.find((item) => item.id === activeSourceId) || SOURCES[0];
    const s = src[lk];
    box.innerHTML =
      '<div>' +
        '<div class="gs-detail-top">' +
          '<div class="gs-detail-title">' +
            '<span class="gs-src-icon"><img src="' + src.icon + '" alt="" width="20" height="20"></span>' +
            '<h3>' + s.name + '</h3>' +
          '</div>' +
          '<span class="gs-detail-pill">' + s.mode + '</span>' +
        '</div>' +
        '<p class="gs-detail-summary" style="margin-top:14px">' + s.summary + '</p>' +
        '<ol class="gs-detail-steps" style="margin-top:20px">' +
          s.steps.map((step, i) => '<li><span class="mono">0' + (i + 1) + '</span><span>' + step + '</span></li>').join('') +
        '</ol>' +
      '</div>' +
      '<div class="gs-detail-privacy">' +
        '<b>' + d['src.privacy.label'] + '</b>' +
        '<span>' + s.privacy + '</span>' +
      '</div>';
  }

  function applyLang(lang) {
    if (!ATTR[lang]) lang = 'en';
    currentLang = lang;
    const d = dict(lang);
    document.documentElement.lang = ATTR[lang];
    document.title = d.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = d['meta.desc'];
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = d.title;
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = d['meta.desc'];
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = d.title;
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.content = d['meta.desc'];

    document.querySelectorAll('[data-copy]').forEach((el) => {
      const key = el.getAttribute('data-copy');
      if (d[key] != null) el.textContent = d[key];
    });
    document.querySelectorAll('[data-copy-html]').forEach((el) => {
      const key = el.getAttribute('data-copy-html');
      if (d[key] != null) el.innerHTML = d[key];
    });
    document.querySelectorAll('[data-home]').forEach((a) => {
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('#')) return;
      const u = new URL(raw, location.href);
      if (u.origin !== location.origin) return;
      u.searchParams.set('lang', lang);
      a.href = u.href;
    });

    const relCta = document.getElementById('hero-releases-cta');
    if (relCta) relCta.href = RELEASES_URL;

    const dlOrder = document.querySelector('.dl');
    if (dlOrder && isWin) {
      const winCard = document.getElementById('dl-card-win');
      if (winCard && dlOrder.firstElementChild !== winCard) {
        dlOrder.prepend(winCard);
      }
    }

    const sel = document.getElementById('language');
    if (sel) sel.value = lang;
    try { localStorage.setItem('autoclip.lang', lang); } catch {}

    renderSourceList();
    renderSourceDetail();
  }

  /* Hero OBS pipeline simulation */
  let simTimers = [];
  function clearSim() {
    simTimers.forEach((id) => clearTimeout(id));
    simTimers = [];
  }
  function runDemoSimulation() {
    clearSim();
    const art = document.getElementById('gs-hero-art');
    const demo = document.getElementById('gs-demo');
    const clock = document.getElementById('gs-demo-clock');
    if (!art || !demo) return;
    const steps = [...demo.querySelectorAll('.demo-steps li')];
    const pills = [...demo.querySelectorAll('.demo-pills span')];

    if (reduce) {
      steps.forEach((li) => { li.classList.remove('now'); li.classList.add('done'); });
      pills.forEach((p) => p.classList.add('on'));
      if (clock) clock.textContent = '0:42';
      demo.classList.add('is-done');
      art.classList.add('done');
      return;
    }

    art.classList.remove('done');
    demo.classList.remove('is-done');
    steps.forEach((li) => li.classList.remove('now', 'done'));
    pills.forEach((p) => p.classList.remove('on'));
    if (clock) clock.textContent = '0:00';

    const pillSchedule = [250, 420, 580, 740];
    pills.forEach((p, idx) => {
      simTimers.push(setTimeout(() => p.classList.add('on'), pillSchedule[idx] || 300));
    });

    const stepTimes = [900, 1750, 2650, 3550];
    const clockMarks = ['0:02', '0:08', '0:29', '0:42'];
    steps.forEach((li, idx) => {
      simTimers.push(setTimeout(() => {
        if (idx > 0) {
          steps[idx - 1].classList.remove('now');
          steps[idx - 1].classList.add('done');
        }
        li.classList.add('now');
        if (clock) clock.textContent = clockMarks[idx];
      }, stepTimes[idx]));
    });

    simTimers.push(setTimeout(() => {
      const last = steps[steps.length - 1];
      if (last) { last.classList.remove('now'); last.classList.add('done'); }
      demo.classList.add('is-done');
      art.classList.add('done');
    }, 4350));
  }

  /* Sticky .story checklist scroll spy */
  function initStory() {
    const navItems = [...document.querySelectorAll('[data-story-nav]')];
    const panels = [...document.querySelectorAll('[data-story]')];
    if (!navItems.length || !panels.length) return;
    const setActive = (idx) => {
      navItems.forEach((el, i) => el.classList.toggle('on', i === idx));
      panels.forEach((el, i) => el.classList.toggle('on', i === idx));
    };
    setActive(0);
    navItems.forEach((el, i) => {
      el.addEventListener('click', () => {
        panels[i]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        setActive(i);
      });
    });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-story'));
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      }, { rootMargin: '-32% 0px -48% 0px', threshold: 0.05 });
      panels.forEach((panel) => io.observe(panel));
    }
  }

  /* Copy share link */
  function initShare() {
    const btn = document.getElementById('gs-share-btn');
    if (!btn) return;
    let resetTimer = 0;
    btn.addEventListener('click', async () => {
      const d = dict(currentLang);
      const url = location.href;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      btn.textContent = d['share.copied'];
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        btn.textContent = dict(currentLang)['share.btn'];
      }, 2200);
    });
  }

  /* Boot */
  let saved = null;
  try { saved = localStorage.getItem('autoclip.lang'); } catch {}
  const q = new URLSearchParams(location.search).get('lang');
  const navLang = (navigator.languages || [navigator.language || 'en'])
    .map((l) => l.toLowerCase().split('-')[0])
    .filter((l) => ATTR[l])[0];
  applyLang(ATTR[q] ? q : ATTR[saved] ? saved : navLang || 'zh');

  document.getElementById('language')?.addEventListener('change', (e) => {
    applyLang(e.target.value);
    const u = new URL(location.href);
    u.searchParams.set('lang', e.target.value);
    history.replaceState(null, '', u);
  });

  document.getElementById('gs-demo-replay')?.addEventListener('click', runDemoSimulation);

  runDemoSimulation();
  initStory();
  initShare();
})();
