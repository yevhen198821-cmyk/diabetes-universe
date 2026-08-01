import { EventCard } from './EventCard';

/**
 * Типизированный каталог примеров использования.
 *
 * Файл можно подключить к Storybook без изменения примеров после добавления
 * Storybook в проект.
 */
export function EventCardExamples() {
  return (
    <div className="grid max-w-2xl gap-3 bg-slate-50 p-6">
      <EventCard
        context="Перед завтраком"
        time="08:00"
        title="Глюкоза"
        type="glucose"
        unit="ммоль/л"
        value="6,4"
        variant="compact"
      />

      <EventCard
        context="Перед завтраком"
        status="completed"
        subtitle="Быстродействующий инсулин"
        time="08:05"
        title="NovoRapid"
        type="insulin"
        unit="ЕД"
        value="4"
        variant="standard"
      />

      <EventCard
        context="После инсулина"
        subtitle="Завтрак"
        time="08:20"
        title="Питание"
        type="nutrition"
        unit="г углеводов"
        value="42"
        variant="standard"
      />
    </div>
  );
}
