# @warpgogol/werkstatt-godot-game

Українська | [English](README.md)

Плагін Werkstatt для стека Godot 4.x + C# + .NET 8+. Реалізує контракт `werkstatt/plugin@1`: 12 валідаторів сцен/ассетів/проєкту, хук збірки через dotnet, адаптери деплою на itch.io та GitHub Releases, хук скаффолда проєкту та генерація release evidence.

---

## Що робить цей пакет

Це **стек-плагін** для рушія [Werkstatt](https://www.npmjs.com/package/@warpgogol/werkstatt). Він надає все, що рушію потрібно для управління проєктом гри на Godot 4.x з C#:

- **12 валідаторів** (структура сцен, gitignore, скан секретів, конфіг проєкту, посилання сцен, csproj, ресурси, скрипти, експорт-пресети, унікальність UID, NuGet-пакети, аддони)
- **Хук збірки** (запускає `dotnet build` потім Godot export)
- **2 адаптери деплою** (itch.io, GitHub Releases)
- **Хук скаффолда** (генерує бойлерплейт Godot-проєкту)
- **Хук release evidence** (SHA-256 хеші для цілісності релізу)
- **Dev-команди** (dev server, тестування, smoke test, playtest, скріншот, генерація контексту)

Цей пакет не використовується самостійно — його завантажує рушій Werkstatt під час створення проєкту з профілем `godot-csharp`.

---

## Встановлення

Пакет встановлюється як devDependency разом з рушієм Werkstatt:

```sh
pnpm add -D @warpgogol/werkstatt @warpgogol/werkstatt-godot-game
```

> **Примітка для агентів:** Після створення проєкту командою `forge create --profile godot-csharp` завжди встановлюйте рушій та цей плагін. Прив'язки в `forge.yaml` посилаються на команди з цих пакунків, і вони не працюватимуть, якщо пакунки не встановлені.

---

## Як це вписується в екосистему Werkstatt

| Пакет | Роль |
| --- | --- |
| `@warpgogol/forge` | Шар управління — навички, RFC/ADR робочі процеси, CLI, скаффолд проєктів |
| `@warpgogol/werkstatt` | Рушій runtime — місії, релізи, розгортання, сертифікація, Bordbuch |
| `@warpgogol/werkstatt-shared` | Спільна інфраструктура — перевірки, інтеграція, онтологія, паспорт |
| `@warpgogol/werkstatt-godot-game` | **Цей пакет** — плагин стека Godot для десктопних/мобільних ігор |

**Forge** створює проєкт і налаштовує управління. **Werkstatt** керує життєвим циклом (місії, релізи, розгортання). **Цей плагін** надає специфічні для Godot валідатори, хуки збірки та адаптери деплою, які рушій викликає під час пайплайну.

---

## Валідатори

Плагін реєструє 12 kernel-команд, які запускаються під час check gate:

| Команда | Інваріант | Що перевіряє |
| --- | --- | --- |
| `godot.scene.validate` | GODOT-01 | Файли сцен (.tscn) у `Scenes/`, скрипти (.cs) у `Scripts/` |
| `godot.gitignore.validate` | GODOT-02 | Директорія `.godot/` у gitignore |
| `godot.secret.scan` | GODOT-03 | Немає хардкожених API-ключів або секретів у C#-коді |
| `godot.project.config.validate` | GODOT-04 | Зміни autoloads та input map у `project.godot` вимагають підтвердження |
| `godot.scene.reference.validate` | GODOT-05 | `res://`-посилання у `.tscn` вказують на існуючі файли |
| `godot.csproj.validate` | GODOT-06 | `Game.csproj` використовує `Godot.NET.Sdk`, ціль `net8.0`, dynamic loading |
| `godot.resource.validate` | GODOT-07 | `.tres`-файли у `Resources/`, `res://`-посилання існують |
| `godot.script.validate` | GODOT-08 | C#-скрипти: ім'я класу збігається з ім'ям файлу, `partial` на Node-підкласах, `using Godot;` |
| `godot.export.presets.validate` | GODOT-09 | `export_presets.cfg` має валідні пресети з непорожніми шляхами та відомими платформами |
| `godot.uid.validate` | GODOT-10 | `.tscn`/`.tres`-файли мають унікальні `uid://`-декларації |
| `godot.nuget.validate` | GODOT-11 | NuGet-пакети в `Game.csproj` Godot-сумісні та непроблемні |
| `godot.addon.validate` | GODOT-12 | Аддони мають валідний `plugin.cfg`, увімкнені в `project.godot`, декларують NuGet-залежності |

`checkGate` запускає всі 12 валідаторів послідовно. Усі мають пройти (GODOT-04 — неблокуючі попередження).

---

## Адаптери деплою

| Адаптер | Ціль | Джерело облікових даних |
| --- | --- | --- |
| `itch-io` | itch.io | `deploy.itch.apiKey`, `deploy.itch.project` з `systems/registry.yaml` |
| `github-releases` | GitHub Releases | `deploy.github.token`, `deploy.github.repo` з `systems/registry.yaml` |

Облікові дані зчитуються з системного реєстру, а не з змінних оточення.

---

## Хуки

| Хук | Що робить |
| --- | --- |
| `build` | Запускає `dotnet build ./Game.csproj` потім Godot export для кожного пресету |
| `checkGate` | Запускає всі 12 валідаторів послідовно |
| `releaseEvidence` | Генерує SHA-256 хеші для перевірки цілісності релізу |
| `scaffoldProject` | Генерує бойлерплейт Godot-проєкту (сцени, скрипти, csproj, project.godot) |

---

## Dev-команди

| Команда | Що робить |
| --- | --- |
| `godot.dev.server` | Запускає `godot --editor` для інтерактивної розробки |
| `godot.test` | Запускає `dotnet test` |
| `godot.smoke.test` | Headless-виявлення runtime-помилок |
| `godot.playtest` | Виявлення runtime-помилок геймплею з детермінованим вводом |
| `godot.screenshot` | Захоплення viewport через Xvfb |
| `godot.context.generate` | Структурований опис проєкту для ШІ-агентів |

---

## Конвенції шляхів

| Шлях | Значення |
| --- | --- |
| Директорія контенту | `Scenes` |
| Директорія дистрибуції | `bin` |
| Точки входу | `project.godot`, `Game.csproj` |
| Директорія сцен | `Scenes` |
| Директорія скриптів | `Scripts` |
| Директорія ресурсів | `Resources` |

---

## Програмний API

```ts
import { werkstattGodotPlugin } from "@warpgogol/werkstatt-godot-game";

// Зареєструвати плагін у рушії Werkstatt
engine.registerPlugin(werkstattGodotPlugin);
```

Плагін експортує єдиний об'єкт `WerkstattPlugin` з `profileId: "godot-csharp"`. Рушій виявляє його автоматично, коли пакет встановлено.

### Subpath-експорти

| Експорт | Що надає |
| --- | --- |
| `@warpgogol/werkstatt-godot-game` | Точка входу плагіна (`werkstattGodotPlugin`) |
| `@warpgogol/werkstatt-godot-game/paths` | Константи шляхів Godot |
| `@warpgogol/werkstatt-godot-game/checks` | Runner check gate |
| `@warpgogol/werkstatt-godot-game/checks/module` | Kernel-модуль з реєстраціями валідаторів |
| `@warpgogol/werkstatt-godot-game/invariants` | Декларації інваріантів GODOT-01..12 |
| `@warpgogol/werkstatt-godot-game/deploy/types` | Визначення типів адаптера деплою |
| `@warpgogol/werkstatt-godot-game/build` | Хук збірки dotnet |
| `@warpgogol/werkstatt-godot-game/release-evidence` | Хук release evidence |

---

## Архітектура

| Директорія | Призначення |
| --- | --- |
| `src/index.ts` | Точка входу плагіна — експортує `werkstattGodotPlugin` |
| `src/paths/` | Конвенції шляхів Godot (`Scenes`, `bin`, точки входу) |
| `src/invariants/` | Декларації інваріантів GODOT-01..12 |
| `src/checks/` | 12 валідаторів + runner check gate + kernel-модуль |
| `src/build/` | Хук збірки dotnet + dev-команди (dev server, test, smoke test, playtest, screenshot, context) |
| `src/dev/` | Kernel-модуль реєстрації dev-команд |
| `src/deploy/` | Адаптери деплою itch.io та GitHub Releases |
| `src/onboarding/` | Хук скаффолда проєкту (генерація бойлерплейту) |
| `src/release-evidence/` | Хук release evidence (SHA-256 хеші) |

---

## Публікація в npm

Цей пакет публікується в реєстр npm як `@warpgogol/werkstatt-godot-game`. Публікація автоматизована через GitHub Actions CI.

### Як це працює

1. Вихідний код знаходиться в монорепозиторії [warpgogol/werkstatt](https://github.com/syrokomskyi/werkstatt) у `packages/werkstatt-godot-game/`.
2. [`@warpgogol/repo-extract`](https://github.com/syrokomskyi/repo-extract) витягує пакет у автономний репозиторій [syrokomskyi/werkstatt-godot-game](https://github.com/syrokomskyi/werkstatt-godot-game), вирівнюючи його до кореня репозиторію та видаляючи залежності робочого простору.
3. Згенерований GitHub Actions CI-воркфлоу запускається при кожному пуші в `main`: lint → typecheck → build → test → `npm publish --provenance --access public`.
4. Секрет `NPM_TOKEN` має бути встановлений у [налаштуваннях репозиторію](https://github.com/syrokomskyi/werkstatt-godot-game/settings/secrets/actions).

### Запуск нового релізу

З кореня монорепозиторію werkstatt:

```sh
# 1. Підняти версію в packages/werkstatt-godot-game/package.json
# 2. Запустити екстракцію (витягує + комітить + пушить в github.com:syrokomskyi/werkstatt-godot-game.git)
pnpm exec repo-extract --config packages/werkstatt-godot-game/extract.config.yaml --verbose

# 3. CI підхоплює пуш і публікує в npm автоматично
```

Після завершення CI перевірте нову версію на [npmjs.com/package/@warpgogol/werkstatt-godot-game](https://www.npmjs.com/package/@warpgogol/werkstatt-godot-game).

---

## Ліцензія

Apache-2.0
