define([
    'jquery',
    'underscore',
    'arches',
    'backbone',
    'knockout'
], function($, _, arches, Backbone, ko) {
    var PermissionSettingsForm = Backbone.View.extend({
        /**
        * A backbone view representing a card component form
        * @augments Backbone.View
        * @constructor
        * @name PermissionSettingsForm
        */

        /**
        * Initializes the view with optional parameters
        * @memberof PermissionSettingsForm.prototype
        * @param {boolean} options.selection - the selected item, either a {@link CardModel} or a {@link NodeModel}
        */
        initialize: function(options) {
            this.selectedIdentities = options.selectedIdentities;
            this.identityList = options.identityList;
            this.selectedCards = options.selectedCards;
            this.noAccessPerm = undefined;
            this.whiteListPerms = [];
            this.groupedNodeList = options.groupedNodeList;

            this.groups = ko.utils.arrayFilter(this.identityList.items(), function(identity) {
                return identity.type === 'group';
            });

            this.groups = _.forEach(this.groups, function(group) {
                group.combinedId = 'group-' + group.id;
            });

            this.users = ko.utils.arrayFilter(this.identityList.items(), function(identity) {
                return identity.type === 'user';
            });

            this.users = _.forEach(this.users, function(user) {
                user.combinedId = 'user-' + user.id;
            });

            this.identityid = ko.observable(this.groups[0]);

            this.identityid.subscribe(function(val) {
                _.forEach(options.identityList.items(), function(item) {
                    if (item.combinedId != val) {
                        item.selected(false);
                    }
                    else {
                        item.selected(true);
                    }
                });
            });

            this.groupedIdentities = ko.observable({
                groups: [
                    { name: 'Groups', items: this.groups },
                    { name: 'Accounts', items: this.users }
                ]
            });

            options.nodegroupPermissions.forEach(function(perm) {
                perm.selected = ko.observable(false);
                if (perm.codename === 'no_access_to_nodegroup') {
                    this.noAccessPerm = perm;
                    perm.selected.subscribe(function(selected) {
                        if (selected) {
                            this.whiteListPerms.forEach(function(perm) {
                                perm.selected(false);
                            }, this);
                        }
                    }, this);
                } else {
                    this.whiteListPerms.push(perm);
                    perm.selected.subscribe(function(selected) {
                        if (selected) {
                            this.noAccessPerm.selected(false);
                        }
                    }, this);
                }
            }, this);

            this.nodegroupPermissions = ko.observableArray(options.nodegroupPermissions);
        },

        save: function() {
            var self = this;
            var postData = {
                'selectedIdentities': this.selectedIdentities(),
                'selectedCards': this.selectedCards(),
                'selectedPermissions': _.filter(this.nodegroupPermissions(), function(perm) {
                    return perm.selected();
                })
            };

            $.ajax({
                type: 'POST',
                url: arches.urls.permission_data,
                data: JSON.stringify(postData),
                success: function(res) {
                    self.trigger('save');
                }
            });
        },

        revert: function() {
            var self = this;
            var postData = {
                'selectedIdentities': this.selectedIdentities(),
                'selectedCards': this.selectedCards()
            };

            $.ajax({
                type: 'DELETE',
                url: arches.urls.permission_data,
                data: JSON.stringify(postData),
                success: function(res) {
                    self.trigger('revert');
                }
            });
        }
    });
    return PermissionSettingsForm;
});
