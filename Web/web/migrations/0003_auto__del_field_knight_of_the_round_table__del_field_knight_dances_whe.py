# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Knight.of_the_round_table'
        db.delete_column('web_knight', 'of_the_round_table')

        # Deleting field 'Knight.dances_whenever_able'
        db.delete_column('web_knight', 'dances_whenever_able')


    def backwards(self, orm):
        # Adding field 'Knight.of_the_round_table'
        db.add_column('web_knight', 'of_the_round_table',
                      self.gf('django.db.models.fields.BooleanField')(default=False),
                      keep_default=False)

        # Adding field 'Knight.dances_whenever_able'
        db.add_column('web_knight', 'dances_whenever_able',
                      self.gf('django.db.models.fields.BooleanField')(default=False),
                      keep_default=False)


    models = {
        'web.knight': {
            'Meta': {'object_name': 'Knight'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['web']