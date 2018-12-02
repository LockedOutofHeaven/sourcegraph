import assert from 'assert'
import { EMPTY_SETTINGS_CASCADE, SettingsCascadeOrError } from '../../../settings/settings'
import { Position } from '../../extension/types/position'
import { Selection } from '../../extension/types/selection'
import * as plain from '../../protocol/plainTypes'
import { EMPTY_MODEL, Model } from '../model'
import { applyContextUpdate, Context, getComputedContextProperty } from './context'

describe('applyContextUpdate', () => {
    it('merges properties', () =>
        assert.deepStrictEqual(applyContextUpdate({ a: 1, b: null, c: 2, d: 3, e: null }, { a: null, b: 1, c: 3 }), {
            b: 1,
            c: 3,
            d: 3,
            e: null,
        } as Context))
})

describe('getComputedContextProperty', () => {
    it('provides config', () => {
        const settings: SettingsCascadeOrError = {
            final: {
                a: 1,
                'a.b': 2,
                'c.d': 3,
            },
            subjects: [],
        }
        assert.strictEqual(getComputedContextProperty(EMPTY_MODEL, settings, {}, 'config.a'), 1)
        assert.strictEqual(getComputedContextProperty(EMPTY_MODEL, settings, {}, 'config.a.b'), 2)
        assert.strictEqual(getComputedContextProperty(EMPTY_MODEL, settings, {}, 'config.c.d'), 3)
        assert.strictEqual(getComputedContextProperty(EMPTY_MODEL, settings, {}, 'config.x'), null)
    })

    describe('model with component', () => {
        const model: Model = {
            ...EMPTY_MODEL,
            visibleViewComponents: [
                {
                    type: 'textEditor',
                    item: {
                        uri: 'file:///a/b.c',
                        languageId: 'l',
                        text: 't',
                    },
                    selections: [new Selection(new Position(1, 2), new Position(3, 4)).toPlain()],
                },
            ],
        }

        describe('resource', () => {
            it('provides resource.uri', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'resource.uri'),
                    'file:///a/b.c'
                ))
            it('provides resource.basename', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'resource.basename'),
                    'b.c'
                ))
            it('provides resource.dirname', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'resource.dirname'),
                    'file:///a'
                ))
            it('provides resource.extname', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'resource.extname'),
                    '.c'
                ))
            it('provides resource.language', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'resource.language'),
                    'l'
                ))
            it('provides resource.type', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'resource.type'),
                    'textDocument'
                ))

            it('returns null when the model has no component', () =>
                assert.strictEqual(
                    getComputedContextProperty(EMPTY_MODEL, EMPTY_SETTINGS_CASCADE, {}, 'resource.uri'),
                    null
                ))
        })

        describe('component', () => {
            it('provides component.type', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.type'),
                    'textEditor'
                ))

            it('returns null when the model has no component', () =>
                assert.strictEqual(
                    getComputedContextProperty(EMPTY_MODEL, EMPTY_SETTINGS_CASCADE, {}, 'component.type'),
                    null
                ))

            function assertSelection(model: Model, expr: string, expected: plain.Selection): void {
                assert.deepStrictEqual(getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, expr), expected)
                assert.deepStrictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, `${expr}.start`),
                    expected.start
                )
                assert.deepStrictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, `${expr}.end`),
                    expected.end
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, `${expr}.start.line`),
                    expected.start.line
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, `${expr}.start.character`),
                    expected.start.character
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, `${expr}.end.line`),
                    expected.end.line
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, `${expr}.end.character`),
                    expected.end.character
                )
            }

            it('provides primary selection', () =>
                assertSelection(model, 'component.selection', {
                    start: { line: 1, character: 2 },
                    end: { line: 3, character: 4 },
                    isReversed: false,
                }))

            it('provides selections', () =>
                assert.deepStrictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selections'),
                    [
                        {
                            start: { line: 1, character: 2 },
                            end: { line: 3, character: 4 },
                            isReversed: false,
                        },
                    ]
                ))

            function assertNoSelection(model: Model): void {
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selection'),
                    null
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selection.start'),
                    null
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selection.end'),
                    null
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selection.start.line'),
                    null
                )
                assert.strictEqual(
                    getComputedContextProperty(
                        model,
                        EMPTY_SETTINGS_CASCADE,
                        {},
                        'component.selection.start.character'
                    ),
                    null
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selection.end.line'),
                    null
                )
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'component.selection.end.character'),
                    null
                )
            }

            it('returns null when there is no selection', () => {
                assertNoSelection({
                    ...EMPTY_MODEL,
                    visibleViewComponents: [
                        {
                            type: 'textEditor',
                            item: {
                                uri: 'file:///a/b.c',
                                languageId: 'l',
                                text: 't',
                            },
                            selections: [],
                        },
                    ],
                })
            })

            it('returns null when there is no component', () => {
                assertNoSelection({
                    ...EMPTY_MODEL,
                    visibleViewComponents: [],
                })
            })

            it('returns undefined for out-of-bounds selection', () =>
                assert.strictEqual(
                    getComputedContextProperty(model, EMPTY_SETTINGS_CASCADE, {}, 'get(component.selections, 1)'),
                    undefined
                ))
        })
    })

    it('falls back to the context entries', () => {
        assert.strictEqual(getComputedContextProperty(EMPTY_MODEL, EMPTY_SETTINGS_CASCADE, { x: 1 }, 'x'), 1)
        assert.strictEqual(getComputedContextProperty(EMPTY_MODEL, EMPTY_SETTINGS_CASCADE, {}, 'y'), undefined)
    })
})
