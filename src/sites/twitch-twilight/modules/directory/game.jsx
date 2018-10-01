'use strict';

// ============================================================================
// Directory (Following, for now)
// ============================================================================

import {SiteModule} from 'utilities/module';
import {createElement} from 'utilities/dom';
import { get } from 'utilities/object';

import GAME_QUERY from './game.gql';

export default class Game extends SiteModule {
	constructor(...args) {
		super(...args);

		this.inject('site.fine');
		this.inject('site.apollo');

		//this.inject('metadata');
		this.inject('i18n');
		this.inject('settings');

		/*this.metadata.definitions.block_game = {
			type: 'directory',
			button(data) {
				return `ffz-directory-toggle-block${data.blocked ? ' active' : ''}`
			},

			setup(data) {
				if ( data.type !== 'GAMES' )
					return null;

				const blocked_games = this.settings.provider.get('directory.game.blocked-games', []),
					blocked = blocked_games.includes(data.name);

				data.blocked = blocked;
				return data;
			},

			label(data) {
				if ( ! data )
					return null;

				return data.blocked ?
					this.i18n.t('directory.unblock', 'Unblock') :
					this.i18n.t('directory.block', 'Block')
			},

			tooltip() {
				return this.i18n.t('directory.block-explain', 'This will let you block streams playing this game from showing up in the directory.');
			},

			click: this.generateClickHandler('directory.game.blocked-games')
		}

		this.metadata.definitions.hide_thumbnails = {
			type: 'directory',
			button(data) {
				return `ffz-directory-toggle-thumbnail${data.hidden ? ' active' : ''}`
			},

			setup(data) {
				if ( data.type !== 'GAMES' )
					return null;

				const hidden_games = this.settings.provider.get('directory.game.hidden-thumbnails', []);

				data.hidden = hidden_games.includes(data.name);
				return data;
			},

			label(data) {
				if ( ! data )
					return null;

				return data.hidden ?
					this.i18n.t('directory.show-thumbnails', 'Show Thumbnails') :
					this.i18n.t('directory.hide-thumbnails', 'Hide Thumbnails');
			},

			tooltip() {
				return this.i18n.t('directory.thumbnails-explain', 'Enabling this will hide thumbnails of this game everywhere in the directory.');
			},

			click: this.generateClickHandler('directory.game.hidden-thumbnails')
		}*/

		this.GameHeader = this.fine.define(
			'game-header',
			n => n.props && n.props.data && n.renderDropsAvailable,
			['dir-game-index', 'dir-community', 'dir-game-videos', 'dir-game-clips', 'dir-game-details']
		);

		this.apollo.registerModifier('DirectoryPage_Game', GAME_QUERY);
	}

	onEnable() {
		this.GameHeader.on('mount', this.updateGameHeader, this);
		this.GameHeader.on('update', this.updateGameHeader, this);

		this.GameHeader.ready((cls, instances) => {
			for(const inst of instances)
				this.updateGameHeader(inst);
		});
	}


	updateGameHeader(inst) {
		this.updateButtons(inst);
	}


	updateButtons(inst) {
		const container = this.fine.getChildNode(inst);
		if ( get('data.variables.type', inst.props) !== 'GAME' || ! container || ! container.querySelector )
			return;

		const buttons = container.querySelector('.tw-flex > .tw-inline-flex');
		if ( ! buttons )
			return;

		const ffz_buttons = buttons.querySelector('.ffz-buttons');
		if ( ffz_buttons )
			ffz_buttons.remove();

		let block_btn, block_label,
			hidden_btn, hidden_label;

		const game = get('data.directory.name', inst.props),
			update_block = () => {
				const blocked_games = this.settings.provider.get('directory.game.blocked-games', []),
					blocked = blocked_games.includes(game);

				block_btn.classList.toggle('active', blocked);
				block_label.textContent = blocked ?
					this.i18n.t('directory.unblock', 'Unblock') :
					this.i18n.t('directory.block', 'Block');
			},
			update_hidden = () => {
				const hidden_games = this.settings.provider.get('directory.game.hidden-thumbnails', []),
					hidden = hidden_games.includes(game);

				hidden_btn.classList.toggle('active', hidden);
				hidden_label.textContent = hidden ?
					this.i18n.t('directory.show-thumbnails', 'Show Thumbnails') :
					this.i18n.t('directory.hide-thumbnails', 'Hide Thumbnails');
			};

		block_btn = (<button
			class="tw-mg-l-1 tw-button ffz-directory-toggle-block"
			onClick={this.generateClickHandler('directory.game.blocked-games', game, update_block)}
		>
			{block_label = <span class="tw-button__text" />}
		</button>);

		update_block();

		hidden_btn = (<button
			class="tw-mg-l-1 tw-button ffz-directory-toggle-thumbnail"
			onClick={this.generateClickHandler('directory.game.hidden-thumbnails', game, update_hidden)}
		>
			{hidden_label = <span class="tw-button__text" />}
		</button>);

		update_hidden();

		buttons.appendChild(<div class="ffz-buttons">
			{block_btn}
			{hidden_btn}
		</div>);
	}

	generateClickHandler(setting, game, update_func) {
		return e => {
			e.preventDefault();
			const values = this.settings.provider.get(setting) || [],
				idx = values.indexOf(game);

			if ( idx === -1 )
				values.push(game);
			else
				values.splice(idx, 1);

			this.settings.provider.set(setting, values);
			this.parent.DirectoryCard.forceUpdate();
			update_func();
		}
	}

	/*unmountGameHeader(inst) { // eslint-disable-line class-methods-use-this
		const timers = inst._ffz_meta_timers;
		if ( timers )
			for(const key in timers)
				if ( timers[key] )
					clearTimeout(timers[key]);
	}


	updateGameHeader(inst) {
		this.updateMetadata(inst);
	}

	updateMetadata(inst, keys) {
		const container = this.fine.getChildNode(inst),
			wrapper = container && container.querySelector && container.querySelector('.side-nav-directory-info__info-wrapper > div + div');

		if ( ! inst._ffz_mounted || ! wrapper )
			return;

		const metabar = wrapper;

		if ( ! keys )
			keys = this.metadata.keys;
		else if ( ! Array.isArray(keys) )
			keys = [keys];

		const timers = inst._ffz_meta_timers = inst._ffz_meta_timers || {},
			refresh_func = key => this.updateMetadata(inst, key),
			data = {
				directory: inst.props.data.directory,
				type: inst.props.directoryType,
				name: inst.props.directoryName,

				_mt: 'directory',
				_inst: inst
			}

		for(const key of keys)
			this.metadata.render(key, data, metabar, timers, refresh_func);
	}

	generateClickHandler(setting) {
		return (data, event, update_func) => {
			const values = this.settings.provider.get(setting, []),
				game = data.name,
				idx = values.indexOf(game);

			if ( idx === -1 )
				values.push(game)
			else
				values.splice(idx, 1);

			this.settings.provider.set(setting, values);
			this.parent.DirectoryCard.forceUpdate();
			update_func();
		}
	}*/
}