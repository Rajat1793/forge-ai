import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserStory = { persona: string; iWant: string; soThat: string };
type AC = { given: string; when: string; then: string };

export type PrdVersionView = {
  problemStatement: string;
  goals: string[];
  nonGoals: string[];
  userStories: unknown;
  acceptanceCriteria: unknown;
  edgeCases: string[];
  successMetrics: string[];
};

export function PrdView({ prd }: { prd: PrdVersionView }) {
  const userStories = prd.userStories as unknown as UserStory[];
  const acceptanceCriteria = prd.acceptanceCriteria as unknown as AC[];

  return (
    <div className="space-y-6">
      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">Problem statement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {prd.problemStatement}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground">
              {prd.goals.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">→</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">Non-goals</CardTitle>
          </CardHeader>
          <CardContent>
            {prd.nonGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="space-y-2 text-sm text-foreground">
                {prd.nonGoals.map((g, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-destructive">×</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">User stories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userStories.map((s, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-card p-3 text-sm leading-6 text-foreground"
            >
              <span className="font-medium text-brand">As a {s.persona}</span>, I want{" "}
              <span className="text-foreground">{s.iWant}</span> so that{" "}
              <span className="text-muted-foreground">{s.soThat}</span>.
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-secondary">
        <CardHeader>
          <CardTitle className="text-base">Acceptance criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {acceptanceCriteria.map((ac, i) => (
            <div key={i} className="rounded-md border border-border bg-card p-3 text-sm leading-6">
              <p className="text-muted-foreground">
                <span className="text-amber-200">Given</span> {ac.given}
              </p>
              <p className="text-muted-foreground">
                <span className="text-amber-200">When</span> {ac.when}
              </p>
              <p className="text-muted-foreground">
                <span className="text-amber-200">Then</span> {ac.then}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">Edge cases</CardTitle>
          </CardHeader>
          <CardContent>
            {prd.edgeCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">None captured.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {prd.edgeCases.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-secondary">
          <CardHeader>
            <CardTitle className="text-base">Success metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {prd.successMetrics.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
