import { ClassEntry } from '@/api/endpoints/generated';
import { Card, CardTitle, CardMeta, CardTags, ClassGlyph } from '@/shared/ui';

interface ClassCardProps {
  classData: ClassEntry;
  onClick: (classId: string) => void;
}

export function ClassCard({ classData, onClick }: ClassCardProps) {
  return (
    <Card
      onClick={() => onClick(classData.id!)}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-center mb-2">
        <ClassGlyph classId={classData.id!} size="md" />
      </div>
      <CardTitle className="text-center font-heading text-white">{classData.name}</CardTitle>
      <CardMeta className="text-center mb-2">
        HD {classData.hitDie} ·{' '}
        {classData.spellcaster ? 'Spellcaster' : 'Martial'}
        {classData.primaryAbility && (
          <> · Primary: {classData.primaryAbility.join('/')}</>
        )}
      </CardMeta>
      <CardTags className="justify-center">
        {classData.savingThrows?.map((st) => (
          <span key={st} className="tag tag-blue">{st}</span>
        ))}
      </CardTags>
    </Card>
  );
}