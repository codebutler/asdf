import { faker } from "@faker-js/faker";
import userEvent from "@testing-library/user-event";
import { difference, ensure, Pselector } from "./util";
import { match, P } from "ts-pattern";
import { fireEvent, waitFor } from "@testing-library/dom";

const FORM_ELEMENT_SELECTOR = "input, select, textarea, *[role=combobox]";

type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const onExecute = async () => {
  await fillElements();
  (document.activeElement as HTMLElement | null)?.blur();
  document.querySelector<HTMLElement>("button[type=submit]")?.focus();
};

const fillElements = async () => {
  const seenElements = new Set<FormElement>();
  let passCount = 0;

  const fillUnseenElements = async () => {
    const allElements = new Set(
      document.querySelectorAll<FormElement>(FORM_ELEMENT_SELECTOR),
    );
    const newElements = difference(allElements, seenElements);
    if (newElements.size === 0) {
      return;
    }

    for (const elem of newElements) {
      try {
        seenElements.add(elem);
        if (shouldSkipElement(elem)) {
          continue;
        }
        await match(elem)
          .with(Pselector("[role=combobox]"), fillCombobox)
          .with(P.instanceOf(HTMLInputElement), fillInput)
          .with(P.instanceOf(HTMLSelectElement), fillSelect)
          .with(P.instanceOf(HTMLTextAreaElement), fillTextArea)
          .exhaustive();
      } catch (e) {
        console.warn("Error filling element", elem, e);
      }
    }

    // Check for any new elements that might have appeared
    if (++passCount < 5) {
      await fillUnseenElements();
    }
  };

  await fillUnseenElements();
};

const fillInput = async (input: HTMLInputElement) => {
  input.select();
  await match(input)
    .with(Pselector("[type=checkbox]"), async (input) => {
      if (faker.datatype.boolean()) {
        await userEvent.click(input);
      }
    })
    .with(Pselector("[type=color]"), (input) =>
      userEvent.type(input, faker.internet.color()),
    )
    .with(Pselector("[type=date], [type=datetime-local]"), (input) =>
      userEvent.type(
        input,
        new Intl.DateTimeFormat(navigator.language).format(faker.date.future()),
      ),
    )
    .with(Pselector("[type=email]"), (input) =>
      userEvent.type(input, faker.internet.email()),
    )
    .with(Pselector("[type=month]"), (input) =>
      userEvent.type(input, faker.date.month()),
    )
    .with(Pselector("[type=number]"), (input) =>
      userEvent.type(
        input,
        faker.number
          .int({
            min: Number(input.min),
            max: Number(input.max),
          })
          .toString(),
      ),
    )
    .with(Pselector("[type=password]"), (input) =>
      userEvent.type(input, faker.internet.password()),
    )
    .with(Pselector("[type=radio]"), async (input) => {
      const allOptions = document.querySelectorAll<HTMLInputElement>(
        `input[name="${input.name}"]`,
      );
      const isAnyOptionChecked = Array.from(allOptions).some(
        (option) => option.checked,
      );
      if (!isAnyOptionChecked) {
        await userEvent.click(
          faker.helpers.arrayElement(Array.from(allOptions)),
        );
      }
    })
    .with(Pselector("[type=range]"), (input) =>
      userEvent.type(
        input,
        faker.number
          .int({
            min: Number(input.min),
            max: Number(input.max),
          })
          .toString(),
      ),
    )
    .with(Pselector("input[type=search]"), (input) =>
      userEvent.type(
        input,
        faker.lorem
          .sentence({
            min: 1,
            max: 4,
          })
          .slice(0, -1),
      ),
    )
    .with(Pselector("[type=tel]"), (input) =>
      userEvent.type(input, faker.phone.number()),
    )
    .with(Pselector("input[type=text]"), (input) =>
      match(input)
        .with(Pselector("[data-input-type=date]"), (input) =>
          userEvent.type(
            input,
            new Intl.DateTimeFormat(navigator.language).format(
              faker.date.future(),
            ),
          ),
        )
        .with(Pselector("[inputmode=decimal], [inputmode=numeric]"), (input) =>
          userEvent.type(
            input,
            faker.number
              .int({
                min: input.min ? Number(input.min) : 0,
                max: input.max ? Number(input.max) : 50_000_000,
              })
              .toString(),
          ),
        )
        .with(Pselector("[name*=first_name]"), (input) =>
          userEvent.type(input, faker.person.firstName()),
        )
        .with(Pselector("[name*=last_name]"), (input) =>
          userEvent.type(input, faker.person.lastName()),
        )
        .with(Pselector("[name*=full_name]"), (input) =>
          userEvent.type(input, faker.person.fullName()),
        )
        .with(Pselector("[name*=address]"), (input) =>
          userEvent.type(input, faker.location.street()),
        )
        .with(Pselector("[name*=city]"), (input) =>
          userEvent.type(input, faker.location.city()),
        )

        .otherwise((input) =>
          userEvent.type(
            input,
            faker.lorem
              .sentence({
                min: 1,
                max: 4,
              })
              .slice(0, -1),
          ),
        ),
    )
    .with(Pselector("input[type=time]"), (input) =>
      userEvent.type(
        input,
        faker.date.future().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      ),
    )
    .with(Pselector("input[type=url]"), (input) =>
      userEvent.type(input, faker.internet.url()),
    )
    .with(Pselector("input[type=week]"), () => null) // FIXME
    .otherwise(() => null);
};

const fillSelect = async (select: HTMLSelectElement) => {
  const options = select.querySelectorAll<HTMLOptionElement>(
    "option:not([disabled]):not([hidden]):not([value=''])",
  );
  if (options.length > 0) {
    const randomOption = faker.helpers.arrayElement(Array.from(options));
    await userEvent.selectOptions(select, randomOption.value);
  }
};

const fillTextArea = async (textarea: HTMLTextAreaElement) => {
  await userEvent.type(textarea, faker.lorem.paragraph());
};

const fillCombobox = async (input: HTMLInputElement) => {
  input.focus();
  fireEvent.keyDown(input, {
    key: "ArrowDown",
    code: "ArrowDown",
    keyCode: 40,
    charCode: 40,
  });

  await waitFor(() =>
    ensure(
      input.getAttribute("aria-expanded") === "true",
      "combobox not expanded",
    ),
  );

  const listboxId = await waitFor(() =>
    ensure(
      input.getAttribute("aria-owns") || input.getAttribute("aria-controls"),
      "combobox has no aria-owns or aria-controls",
    ),
  );

  const listbox = await waitFor(() =>
    ensure(document.getElementById(listboxId), "combobox has no listbox"),
  );

  const options = listbox.querySelectorAll<HTMLElement>(
    "*[role=option], *[role=button], *[role=menuitem]",
  );
  ensure(options.length > 0, "combobox has no options");
  const randomOption = faker.helpers.arrayElement(Array.from(options));
  await userEvent.click(randomOption);
};

const shouldSkipElement = (elem: FormElement) => {
  const isInput = elem instanceof HTMLInputElement;
  const isRadio = isInput && elem.type === "radio";
  const isInputOrTextArea =
    elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement;
  return (
    !elem.checkVisibility() ||
    elem.disabled ||
    (isInput && elem.type === "hidden") ||
    (!isRadio && elem.value) ||
    (isInputOrTextArea && elem.readOnly) ||
    elem.getAttribute("data-value")
  );
};
